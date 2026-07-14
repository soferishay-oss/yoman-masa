import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const role = request.headers.get('x-user-role');

    if (!tenantId || (role !== 'staff' && role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events = await prisma.event.findMany({
      where: { tenantId },
      include: {
        _count: { select: { rsvps: true } },
        rsvps: true
      },
      orderBy: { scheduledDate: 'asc' }
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');
    const role = request.headers.get('x-user-role');

    if (!tenantId || !userId || (role !== 'staff' && role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { title, description, location, scheduledDate } = data;

    if (!title || !scheduledDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newEvent = await prisma.event.create({
      data: {
        tenantId,
        creatorId: userId,
        title,
        description: description || null,
        location: location || null,
        scheduledDate: new Date(scheduledDate),
        status: 'upcoming'
      }
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Failed to create event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
