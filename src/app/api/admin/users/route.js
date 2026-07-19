import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const tenantId = auth?.tenantId;
    const role = auth?.role?.toLowerCase();

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized missing headers' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');

    const whereClause = { 
      tenantId,
      status: { not: 'deleted' }
    };
    
    if (roleFilter) {
      whereClause.role = roleFilter;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: { class: true, managedGroups: true },
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
    const auth = token ? await verifyToken(token) : null;
    const tenantId = auth?.tenantId;
    const role = auth?.role?.toLowerCase();

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
    const { fullName, phoneNumber, email, role: userRole, subRole, classId, managedGroupIds } = data;
    const defaultPassword = await bcrypt.hash('123456', 10);

    const userData = {
      tenantId,
      fullName,
      phoneNumber: phoneNumber || null,
      email: email || null,
      role: userRole || 'student',
      subRole: subRole || null,
      classId: classId || null,
      passwordHash: defaultPassword
    };

    if ((userRole === 'staff' || userRole === 'admin') && managedGroupIds && managedGroupIds.length > 0) {
      userData.managedGroups = {
        connect: managedGroupIds.map(id => ({ id }))
      };
    }

    const newUser = await prisma.user.create({
      data: userData,
      include: { class: true, managedGroups: true }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Failed to create user(s):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
