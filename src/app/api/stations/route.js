import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user to find their group
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { groupId: true }
    });

    if (!user?.groupId) {
      return NextResponse.json([]); // No group = no stations
    }

    // Get stations for this group
    const stations = await prisma.station.findMany({
      where: {
        groupId: user.groupId
      },
      orderBy: {
        date: 'asc'
      }
    });

    return NextResponse.json(stations);
  } catch (error) {
    console.error('Failed to fetch stations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
