import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    const tenantId = auth?.tenantId;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        group: true,
        tenant: true,
        _count: {
          select: { contentEntries: true }
        }
      }
    });

    if (!user || user.status === 'deleted') {
      const response = NextResponse.json({ error: 'User not found' }, { status: 404 });
      response.cookies.delete('auth_token');
      return response;
    }

    if (user.status === 'suspended') {
      const response = NextResponse.json({ error: 'חשבונך ננעל ע"י מנהל המערכת. נא פנה למחנך או למנהל.' }, { status: 403 });
      response.cookies.delete('auth_token');
      return response;
    }

    // For now, we don't have "completed trips" explicitly modeled per user. 
    // We will just mock it or infer it if they have journals from certain stations.
    const stats = {
      journalCount: user._count.contentEntries,
      completedStations: 3, // mocked for now
      progress: 45 // mocked for now
    };

    return NextResponse.json({
      id: user.id,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      email: user.email,
      role: user.role,
      status: user.status,
      groupName: user.group?.name || 'ללא קבוצה',
      tenantName: user.tenant?.name || 'מערכת מסע',
      stats
    });
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    const tenantId = auth?.tenantId;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fullName, phoneNumber, email, password } = await request.json();

    const dataToUpdate = {};
    if (fullName !== undefined) dataToUpdate.fullName = fullName;
    if (phoneNumber !== undefined) dataToUpdate.phoneNumber = phoneNumber;
    if (email !== undefined) dataToUpdate.email = email;
    
    if (password) {
      const bcrypt = require('bcryptjs');
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
