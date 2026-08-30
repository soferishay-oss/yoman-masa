import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const journeys = await prisma.journey.findMany({
      where: { tenantId: auth.tenantId },
      include: {
        stations: {
          where: { isOpen: true }, // Student only sees open stations
          orderBy: { order: 'asc' },
          include: {
            // Check if this student already responded
            responses: {
              where: { userId: auth.userId },
              select: { id: true, createdAt: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter out journeys that have 0 open stations? Or show them as "No open stations". 
    // We'll return all so the student knows a Journey exists.

    return NextResponse.json(journeys);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
