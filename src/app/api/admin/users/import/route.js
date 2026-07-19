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

    const { users, role } = await request.json();
    if (!users || !Array.isArray(users)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    let importedCount = 0;
    const defaultPasswordHash = await bcrypt.hash('1234', 10);

    // Cache classes by name to avoid duplicate DB queries/creations
    const classCache = new Map();

    for (const rawUser of users) {
      // Find expected keys (heb or eng)
      const rawFullName = rawUser['שם מלא'] || rawUser['שם'] || rawUser['fullName'] || rawUser['name'];
      const rawPhone = rawUser['טלפון'] || rawUser['פלאפון'] || rawUser['phoneNumber'] || rawUser['phone'];
      const rawEmail = rawUser['אימייל'] || rawUser['מייל'] || rawUser['דוא"ל'] || rawUser['email'];
      const rawClass = rawUser['כיתה'] || rawUser['class'] || rawUser['שכבה'];

      if (!rawFullName || !rawPhone) {
        continue; // Skip invalid rows
      }

      const cleanPhone = rawPhone.replace(/\D/g, '');
      if (cleanPhone.length < 9) continue;

      let classId = null;

      if (rawClass && role === 'student') {
        const className = rawClass.trim();
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
      const existingUser = await prisma.user.findFirst({
        where: { tenantId, phoneNumber: cleanPhone }
      });

      if (existingUser) {
        // Update existing user with new data if provided
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            fullName: rawFullName,
            email: rawEmail || existingUser.email,
            classId: classId || existingUser.classId
          }
        });
      } else {
        // Create new user
        await prisma.user.create({
          data: {
            tenantId,
            fullName: rawFullName,
            phoneNumber: cleanPhone,
            email: rawEmail || null,
            passwordHash: defaultPasswordHash,
            role: role || 'student',
            classId
          }
        });
        importedCount++;
      }
    }

    return NextResponse.json({ success: true, count: importedCount });
  } catch (error) {
    console.error('Failed to import users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
