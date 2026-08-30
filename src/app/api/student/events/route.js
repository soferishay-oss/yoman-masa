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

    if (!userId || !tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const events = await prisma.event.findMany({
      where: { tenantId },
      orderBy: { scheduledDate: 'asc' }
    });

    const journeys = await prisma.journey.findMany({
      where: { tenantId, startDate: { not: null } }
    });

    const journeyEvents = journeys.map(j => ({
      id: `journey_${j.id}`,
      title: j.title,
      subtitle: j.description || 'מסע',
      scheduledDate: j.startDate,
      endDate: j.endDate, // Add this
      type: 'journey',
      color: '#3b82f6', // Blue color for journeys
      isJourney: true
    }));

    const allEvents = [...events, ...journeyEvents].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    
    return NextResponse.json(allEvents);
  } catch (error) {
    console.error('Failed to fetch events for student:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
