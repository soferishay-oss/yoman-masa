import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    const tenantId = auth?.tenantId;

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

    // Clear forceMoodSurvey flag if it exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.preferences && user.preferences.forceMoodSurvey) {
      const updatedPrefs = { ...user.preferences };
      delete updatedPrefs.forceMoodSurvey;
      await prisma.user.update({
        where: { id: userId },
        data: { preferences: updatedPrefs }
      });
    }

    return NextResponse.json(newMood, { status: 201 });
  } catch (error) {
    console.error('Failed to create mood:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    
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
