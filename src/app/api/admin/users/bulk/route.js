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

    const { userIds, action, data } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'No users selected' }, { status: 400 });
    }

    if (action === 'delete') {
      // Soft delete
      await prisma.user.updateMany({
        where: {
          id: { in: userIds },
          tenantId
        },
        data: { status: 'deleted' }
      });
      return NextResponse.json({ message: 'Users deleted successfully' });
    }

    if (action === 'update_group') {
      await prisma.user.updateMany({
        where: {
          id: { in: userIds },
          tenantId
        },
        data: { groupId: data.groupId }
      });
      return NextResponse.json({ message: 'Users assigned to group successfully' });
    }

    if (action === 'update_status') {
      await prisma.user.updateMany({
        where: {
          id: { in: userIds },
          tenantId
        },
        data: { status: data.status }
      });
      return NextResponse.json({ message: 'User statuses updated successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Bulk user action failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
