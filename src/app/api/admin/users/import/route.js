import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const tenantId = auth?.tenantId;
    const adminRole = auth?.role?.toLowerCase();

    if (!tenantId || adminRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { nameFormat: true }
    });
    const nameFormat = tenant?.nameFormat || 'last_first';

    const { users, role } = await request.json();
    if (!users || !Array.isArray(users)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    let importedCount = 0;
    const defaultPasswordHash = await bcrypt.hash('1234', 10);

    // Cache classes by name to avoid duplicate DB queries/creations
    const classCache = new Map();
    const errors = [];

    for (const rawUser of users) {
      try {
        // Find expected keys (heb or eng)
      const rawNationalId = rawUser['תז'] || rawUser['ת.ז.'] || rawUser['nationalId'];
      const rawFirstName = rawUser['שם פרטי'] || rawUser['firstName'];
      const rawLastName = rawUser['שם משפחה'] || rawUser['lastName'];
      const rawFullName = rawUser['שם מלא'] || rawUser['שם מורה'] || rawUser['שם'] || rawUser['fullName'] || rawUser['name'];
      const rawPhone = rawUser['טלפון נייד'] || rawUser['טלפון'] || rawUser['פלאפון'] || rawUser['phoneNumber'] || rawUser['phone'];
      const rawEmail = rawUser['מייל'] || rawUser['אימייל'] || rawUser['דוא"ל'] || rawUser['email'];
      const rawClass = rawUser['כיתה'] || rawUser['class'] || rawUser['שכבה'];
      const rawParallel = rawUser['מקבילה'];

      // Build full name if separate parts provided
      let finalFirstName = rawFirstName || null;
      let finalLastName = rawLastName || null;
      let finalFullName = rawFullName || null;

      if (rawFirstName && rawLastName) {
        finalFullName = nameFormat === 'first_last' 
          ? `${rawFirstName} ${rawLastName}`
          : `${rawLastName} ${rawFirstName}`;
      } else if (rawFullName) {
        const parts = rawFullName.split(' ');
        if (parts.length > 1) {
          if (nameFormat === 'first_last') {
            finalFirstName = parts[0];
            finalLastName = parts.slice(1).join(' ');
          } else {
            finalLastName = parts[0];
            finalFirstName = parts.slice(1).join(' ');
          }
        } else {
          finalFirstName = rawFullName;
        }
      }

      if (!finalFullName && (rawFirstName || rawLastName)) {
        finalFullName = [rawFirstName, rawLastName].filter(Boolean).join(' ');
      }

      if (!finalFullName || (!rawPhone && !rawNationalId)) {
        continue; // Skip invalid rows
      }

      let cleanPhone = null;
      if (rawPhone) {
        cleanPhone = rawPhone.toString().replace(/\D/g, '');
        if (cleanPhone.length < 9) cleanPhone = null;
      }
      
      let nationalIdStr = rawNationalId ? String(rawNationalId).trim() : null;
      if (nationalIdStr === '') nationalIdStr = null;

      let classId = null;

      let className = null;
      if (rawClass) className = rawClass.trim();
      if (rawParallel) className = className ? `${className} ${rawParallel.trim()}` : rawParallel.trim();

      if (className && role === 'student') {
        if (classCache.has(className)) {
          classId = classCache.get(className);
        } else {
          // Find or create class
          let cls = await prisma.group.findFirst({
            where: { tenantId, type: 'class', name: className }
          });
          if (!cls) {
            cls = await prisma.group.create({
              data: {
                tenantId,
                name: className,
                type: 'class'
              }
            });
          }
          classId = cls.id;
          classCache.set(className, classId);
        }
      }

      // Check if user already exists
      let existingUser = null;
      if (nationalIdStr) {
        existingUser = await prisma.user.findFirst({ where: { tenantId, nationalId: nationalIdStr } });
      }
      if (!existingUser && cleanPhone) {
        existingUser = await prisma.user.findFirst({ where: { tenantId, phoneNumber: cleanPhone } });
      }

      if (existingUser) {
        // Update existing user with new data if provided
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            fullName: finalFullName,
            firstName: finalFirstName || existingUser.firstName,
            lastName: finalLastName || existingUser.lastName,
            email: rawEmail || existingUser.email,
            classId: classId || existingUser.classId,
            nationalId: nationalIdStr || existingUser.nationalId,
            phoneNumber: cleanPhone || existingUser.phoneNumber
          }
        });
        importedCount++;
      } else {
        // Create new user
        await prisma.user.create({
          data: {
            tenantId,
            fullName: finalFullName,
            firstName: finalFirstName,
            lastName: finalLastName,
            nationalId: nationalIdStr,
            phoneNumber: cleanPhone,
            email: rawEmail || null,
            passwordHash: defaultPasswordHash,
            role: role || 'student',
            classId
          }
        });
        importedCount++;
      }
      } catch (err) {
        console.error('Error importing row:', rawUser, err.message);
        errors.push(`שגיאה בייבוא שורה (${rawUser['שם מלא'] || rawUser['שם פרטי'] || 'ללא שם'}): ${err.message}`);
      }
    }

    return NextResponse.json({ success: true, count: importedCount, errors: errors.length > 0 ? errors : undefined });
  } catch (error) {
    console.error('Failed to import users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
