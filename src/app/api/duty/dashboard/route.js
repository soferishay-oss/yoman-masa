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
    const groupId = auth?.groupId;
    const isDutyStudent = auth?.isDutyStudent;

    if (!userId || !tenantId || !isDutyStudent || !groupId) {
      return NextResponse.json({ error: 'Unauthorized or not a duty student' }, { status: 401 });
    }

    // Find the nearest upcoming event or active event today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const activeEvent = await prisma.event.findFirst({
      where: {
        tenantId,
        date: { gte: startOfDay }
      },
      orderBy: { date: 'asc' }
    });

    // Fetch all students in the same group
    const groupMembers = await prisma.user.findMany({
      where: { 
        tenantId,
        groupId,
        role: 'student',
        status: { not: 'deleted' }
      },
      select: {
        id: true,
        fullName: true,
        eventRSVPs: activeEvent ? {
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
