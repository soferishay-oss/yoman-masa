import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const role = request.headers.get('x-user-role');

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stations = await prisma.station.findMany({
      where: { tenantId },
      orderBy: { orderIndex: 'asc' }
    });

    return NextResponse.json(stations);
  } catch (error) {
    console.error('Failed to fetch stations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const role = request.headers.get('x-user-role');

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, stationType, dateMode, scheduledDate, orderIndex } = data;

    if (!name || !stationType || !dateMode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newStation = await prisma.station.create({
      data: {
        tenantId,
        name,
        stationType,
        dateMode,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        orderIndex: parseInt(orderIndex) || 0
      }
    });

    return NextResponse.json(newStation, { status: 201 });
  } catch (error) {
    console.error('Failed to create station:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
