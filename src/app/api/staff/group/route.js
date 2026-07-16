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
    const role = auth?.role;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (role !== 'staff' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get staff's group
    const staff = await prisma.user.findUnique({
      where: { id: userId },
      select: { groupId: true, managedGroups: { select: { id: true } } }
    });

    const groupIds = [];
    if (staff?.groupId) groupIds.push(staff.groupId);
    if (staff?.managedGroups) groupIds.push(...staff.managedGroups.map(g => g.id));

    if (role !== 'admin' && groupIds.length === 0) {
      return NextResponse.json({ error: 'Staff is not assigned to a group' }, { status: 400 });
    }

    // Fetch students: all for admin, filtered for staff
    const whereClause = {
      tenantId,
      role: 'student'
    };
    if (role !== 'admin') {
      whereClause.groupId = { in: groupIds };
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      include: {
        group: true,
        journalPosts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { mood: true }
        }
      }
    });

    const mappedStudents = students.map(student => {
      const lastPost = student.journalPosts[0];
      const moodValue = lastPost?.mood?.score || 5;
      
      let trend = 'up';
      let moodStr = 'טוב';
      
      if (moodValue < 4) {
        trend = 'down';
        moodStr = 'זקוק לתשומת לב';
      } else if (moodValue > 7) {
        trend = 'up';
        moodStr = 'מצוין';
      }

      return {
        id: student.id,
        name: student.fullName,
        mood: moodStr,
        trend: trend
      };
    });

    return NextResponse.json(mappedStudents);
  } catch (error) {
    console.error('Failed to fetch staff group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
