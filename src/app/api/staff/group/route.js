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

    // Get staff's managed groups and memberships
    const staff = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        classId: true, 
        managedGroups: { select: { id: true } },
        groupMemberships: { select: { groupId: true } }
      }
    });

    const groupIds = [];
    if (staff?.classId) groupIds.push(staff.classId);
    if (staff?.managedGroups) groupIds.push(...staff.managedGroups.map(g => g.id));
    if (staff?.groupMemberships) groupIds.push(...staff.groupMemberships.map(m => m.groupId));

    if (role !== 'admin' && groupIds.length === 0) {
      return NextResponse.json({ error: 'Staff is not assigned to any group' }, { status: 400 });
    }

    // Fetch students: all for admin, filtered for staff
    const whereClause = {
      tenantId,
      role: 'student'
    };
    
    if (role !== 'admin') {
      whereClause.OR = [
        { classId: { in: groupIds } },
        { groupMemberships: { some: { groupId: { in: groupIds } } } }
      ];
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      include: {
        class: true,
        groupMemberships: true,
        moodChecks: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const mappedStudents = students.map(student => {
      const moodChecks = student.moodChecks || [];
      const lastPost = moodChecks.length > 0 ? moodChecks[0] : null;
      const moodValue = lastPost?.ratingValue || 5;
      
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
        trend: trend,
        classId: student.classId,
        groupMemberships: student.groupMemberships
      };
    });

    return NextResponse.json(mappedStudents);
  } catch (error) {
    console.error('Failed to fetch staff group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
