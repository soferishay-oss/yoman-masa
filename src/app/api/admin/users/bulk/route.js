import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const tenantId = auth?.tenantId;
    const role = auth?.role?.toLowerCase();

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userIds, action, classId } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'No users selected' }, { status: 400 });
    }

    if (action === 'delete') {
      await prisma.user.deleteMany({
        where: {
          id: { in: userIds },
          tenantId
        }
      });
      return NextResponse.json({ message: 'Users deleted successfully' });
    }

    if (action === 'change_class') {
      await prisma.user.updateMany({
        where: {
          id: { in: userIds },
          tenantId,
          role: 'student'
        },
        data: { classId: classId === null ? null : classId }
      });
      return NextResponse.json({ message: 'Users moved to class successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Bulk user action failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

