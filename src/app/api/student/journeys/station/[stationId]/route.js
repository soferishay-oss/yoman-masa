import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request, { params }) {
  try {
    const { stationId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { answers, mediaUrls } = await request.json();

    const station = await prisma.journeyStation.findUnique({
      where: { id: stationId },
      include: { journey: true }
    });

    if (!station || station.journey.tenantId !== auth.tenantId) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    if (!station.isOpen) {
      return NextResponse.json({ error: 'Station is not open' }, { status: 403 });
    }

    // Upsert response
    const response = await prisma.journeyResponse.upsert({
      where: {
        stationId_userId: {
          stationId: stationId,
          userId: auth.userId
        }
      },
      update: {
        answers: answers || {},
        mediaUrls: mediaUrls || []
      },
      create: {
        stationId,
        userId: auth.userId,
        answers: answers || {},
        mediaUrls: mediaUrls || []
      }
    });

    return NextResponse.json(response);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
