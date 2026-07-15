import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-dev');

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized missing token' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const tenantId = payload.tenantId;
    const role = payload.role;

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized missing headers' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: { tenantId },
      include: { group: true },
      orderBy: { fullName: 'asc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized missing token' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const tenantId = payload.tenantId;
    const role = payload.role;

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized missing headers' }, { status: 401 });
    }

    const data = await request.json();

    // Handle Bulk Upload (Array)
    if (Array.isArray(data)) {
      const defaultPassword = await bcrypt.hash('123456', 10);
      let successCount = 0;
      let errors = [];

      for (const item of data) {
        try {
          await prisma.user.create({
            data: {
              tenantId,
              fullName: item.fullName,
              phoneNumber: item.phoneNumber || null,
              email: item.email || null,
              role: item.role || 'student',
              subRole: item.subRole || null,
              classId: item.classId || null,
              groupId: item.groupId || null,
              passwordHash: defaultPassword
            }
          });
          successCount++;
        } catch (err) {
          errors.push(`שגיאה ביצירת משתמש ${item.fullName}: ${err.message}`);
        }
      }

      return NextResponse.json({ message: `נוצרו ${successCount} משתמשים בהצלחה`, errors });
    }

    // Handle Single User Creation
    const { fullName, phoneNumber, email, userRole, subRole, classId, groupId } = data;
    const defaultPassword = await bcrypt.hash('123456', 10);

    const newUser = await prisma.user.create({
      data: {
        tenantId,
        fullName,
        phoneNumber: phoneNumber || null,
        email: email || null,
        role: userRole || 'student',
        subRole: subRole || null,
        classId: classId || null,
        groupId: groupId || null,
        passwordHash: defaultPassword
      },
      include: { group: true }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Failed to create user(s):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
