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

    const events = await prisma.event.findMany({
      where: { 
        tenantId,
        status: 'upcoming'
      },
      include: {
        rsvps: {
          where: { userId }
        }
      },
      orderBy: { scheduledDate: 'asc' }
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to fetch student events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, status } = await request.json(); // status: going, not_going

    if (!eventId || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Upsert RSVP
    const existing = await prisma.eventRSVP.findFirst({
      where: { eventId, userId }
    });

    if (existing) {
      const updated = await prisma.eventRSVP.update({
        where: { id: existing.id },
        data: { status }
      });
      return NextResponse.json(updated);
    } else {
      const created = await prisma.eventRSVP.create({
        data: {
          eventId,
          userId,
          status
        }
      });
      return NextResponse.json(created);
    }
  } catch (error) {
    console.error('Failed to RSVP:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
