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

    const alerts = await prisma.staffAlert.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to recent alerts
    });
    
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
