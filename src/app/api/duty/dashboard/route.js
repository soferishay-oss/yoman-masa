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
    const isDutyStudent = auth?.isDutyStudent;

    if (!userId || !tenantId || !isDutyStudent) {
      return NextResponse.json({ error: 'Unauthorized or not a duty student' }, { status: 401 });
    }

    // Find the groups this user is a duty student in
    const dutyMemberships = await prisma.groupMember.findMany({
      where: { userId, isDutyStudent: true },
      select: { groupId: true }
    });
    
    const dutyGroupIds = dutyMemberships.map(m => m.groupId);

    // Find the nearest upcoming event or active event today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const activeEvent = await prisma.event.findFirst({
      where: {
        tenantId,
        scheduledDate: { gte: startOfDay }
      },
      orderBy: { scheduledDate: 'asc' }
    });

    // Fetch all students in the duty groups
    const groupMembers = await prisma.user.findMany({
      where: { 
        tenantId,
        groupMemberships: {
          some: { groupId: { in: dutyGroupIds } }
        },
        role: 'student',
        status: { not: 'deleted' }
      },
      select: {
        id: true,
        fullName: true,
        eventRsvps: activeEvent ? {
          where: { eventId: activeEvent.id },
          select: { id: true, status: true, attendedAt: true }
        } : false
      },
      orderBy: { fullName: 'asc' }
    });

    return NextResponse.json({
      activeEvent,
      groupMembers
    });
  } catch (error) {
    console.error('Duty dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
