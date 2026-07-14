import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');
    const role = request.headers.get('x-user-role');

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (role !== 'staff' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get staff's group
    const staff = await prisma.user.findUnique({
      where: { id: userId },
      select: { groupId: true }
    });

    if (!staff?.groupId) {
      return NextResponse.json({ error: 'Staff is not assigned to a group' }, { status: 400 });
    }

    // Fetch all students in this group and their latest journal/mood
    const students = await prisma.user.findMany({
      where: {
        groupId: staff.groupId,
        role: 'student'
      },
      include: {
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
