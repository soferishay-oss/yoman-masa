import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        group: true,
        tenant: true,
        _count: {
          select: { contentEntries: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For now, we don't have "completed trips" explicitly modeled per user. 
    // We will just mock it or infer it if they have journals from certain stations.
    const stats = {
      journalCount: user._count.contentEntries,
      completedStations: 3, // mocked for now
      progress: 45 // mocked for now
    };

    return NextResponse.json({
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      groupName: user.group?.name || 'ללא קבוצה',
      tenantName: user.tenant?.name || 'מערכת מסע',
      stats
    });
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fullName, phoneNumber } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { fullName, phoneNumber }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
