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
      include: { managedGroups: true }
    });
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let whereClause = { tenantId };
    
    if (user.role === 'staff') {
      const groupIds = [];
      if (user.classId) groupIds.push(user.classId);
      if (user.managedGroups) groupIds.push(...user.managedGroups.map(g => g.id));
      
      const studentsInGroups = await prisma.user.findMany({
        where: { 
          tenantId, 
          OR: [
            { classId: { in: groupIds } },
            { groupMemberships: { some: { groupId: { in: groupIds } } } }
          ]
        },
        select: { id: true }
      });
      const studentIds = studentsInGroups.map(s => s.id);
      whereClause.userId = { in: studentIds };
    }

    const moods = await prisma.moodCheck.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 500 // Limit for safety
    });

    return NextResponse.json(moods);
  } catch (error) {
    console.error('Failed to fetch moods:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
