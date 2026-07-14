import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { groupId: true, tenantId: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return all users in the same tenant to allow sending messages to staff as well
    const users = await prisma.user.findMany({
      where: {
        tenantId: currentUser.tenantId,
        id: { not: userId } // exclude self
      },
      select: {
        id: true,
        fullName: true,
        role: true
      },
      orderBy: {
        fullName: 'asc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
