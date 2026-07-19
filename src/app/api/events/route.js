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
    const role = auth?.role?.toLowerCase();
    const classId = auth?.classId;

    if (!userId || !tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const events = await prisma.event.findMany({
      where: {
        tenantId,
        showOnCalendar: true
      },
      orderBy: { scheduledDate: 'asc' }
    });

    // Filter events by target audience
    const filteredEvents = events.filter(ev => {
      // If no target audience specified, it's for everyone
      if (!ev.targetAudience) return true;
      
      const audience = ev.targetAudience;
      if (audience.type === 'all') return true;
      
      if (audience.type === 'classes') {
        // If user is a student, check if their class is in the list
        if (role === 'student') {
          return classId && audience.classIds?.includes(classId);
        }
        // If user is staff/admin, they see class-specific events if they manage that class or if we just show all class events to staff
        // The user said: "A 9th grade student shouldn't see 8th grade events". But what about staff?
        // Staff should probably see events for classes they manage, or all events. Let's let staff see all events on their calendar.
        if (role !== 'student') {
          return true;
        }
      }
      
      return false;
    });

    return NextResponse.json(filteredEvents);
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
