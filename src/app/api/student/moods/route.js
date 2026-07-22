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

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';

    let startDate = new Date();
    if (range === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (range === 'month') startDate.setMonth(startDate.getMonth() - 1);
    else if (range === '3months') startDate.setMonth(startDate.getMonth() - 3);
    else if (range === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
    else startDate = new Date(0); // all time

    const moods = await prisma.moodCheck.findMany({
      where: {
        tenantId,
        userId: userId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(moods);
  } catch (error) {
    console.error('Failed to fetch student moods:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
