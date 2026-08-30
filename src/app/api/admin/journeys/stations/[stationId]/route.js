import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const { stationId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    if (!auth || !['admin', 'staff', 'owner'].includes(auth.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, isOpen, order, questions } = await request.json();

    // Verify tenant ownership via the journey
    const station = await prisma.journeyStation.findUnique({
      where: { id: stationId },
      include: { journey: true }
    });

    if (!station || station.journey.tenantId !== auth.tenantId) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const updated = await prisma.journeyStation.update({
      where: { id: stationId },
      data: {
        title: title !== undefined ? title : station.title,
        description: description !== undefined ? description : station.description,
        isOpen: isOpen !== undefined ? isOpen : station.isOpen,
        order: order !== undefined ? order : station.order,
        questions: questions !== undefined ? questions : station.questions
      }
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { stationId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    if (!auth || !['admin', 'staff', 'owner'].includes(auth.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify tenant ownership
    const station = await prisma.journeyStation.findUnique({
      where: { id: stationId },
      include: { journey: true }
    });

    if (!station || station.journey.tenantId !== auth.tenantId) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    await prisma.journeyStation.delete({
      where: { id: stationId }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
