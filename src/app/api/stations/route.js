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

    // Stations are tenant-wide now, no need to filter by user's group

    // Get stations for this tenant
    const stations = await prisma.station.findMany({
      where: {
        tenantId
      },
      orderBy: {
        orderIndex: 'asc'
      }
    });

    return NextResponse.json(stations);
  } catch (error) {
    console.error('Failed to fetch stations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
