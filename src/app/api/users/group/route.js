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

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true, classId: true, groupMemberships: { select: { groupId: true } } }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUserGroupIds = currentUser.groupMemberships.map(g => g.groupId);
    if (currentUser.classId) currentUserGroupIds.push(currentUser.classId);

    // Return all users in the same tenant to allow sending messages to staff as well
    const users = await prisma.user.findMany({
      where: {
        tenantId: currentUser.tenantId,
        id: { not: userId }, // exclude self
        status: { not: 'deleted' }
      },
      select: {
        id: true,
        fullName: true,
        role: true,
        classId: true,
        groupMemberships: { select: { groupId: true } }
      },
      orderBy: {
        fullName: 'asc'
      }
    });

    const enrichedUsers = users.map(u => {
      const uGroupIds = u.groupMemberships.map(g => g.groupId);
      if (u.classId) uGroupIds.push(u.classId);
      const sharesGroup = uGroupIds.some(id => currentUserGroupIds.includes(id));
      return {
        id: u.id,
        fullName: u.fullName,
        role: u.role,
        sharesGroup
      };
    });

    return NextResponse.json(enrichedUsers);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
