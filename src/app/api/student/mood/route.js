import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { ratingValue, explanation } = data;

    if (ratingValue === undefined) {
      return NextResponse.json({ error: 'Rating value is required' }, { status: 400 });
    }

    // Determine trend - purely basic logic: if < 3 down, else up, or stable
    let trend = 'stable';
    if (ratingValue < 3) trend = 'down';
    else if (ratingValue > 3) trend = 'up';

    const newMood = await prisma.moodCheck.create({
      data: {
        tenantId,
        userId,
        frequency: 'daily', // Hardcoded default for now
        ratingType: '1to5',
        ratingValue: parseInt(ratingValue),
        explanation: explanation || null,
        trendStatus: trend
      }
    });

    return NextResponse.json(newMood, { status: 201 });
  } catch (error) {
    console.error('Failed to create mood:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const moods = await prisma.moodCheck.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    return NextResponse.json(moods.length > 0 ? moods[0] : null);
  } catch (error) {
    console.error('Failed to fetch mood:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
