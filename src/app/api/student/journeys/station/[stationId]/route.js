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

    // Cross-pollination (Side Effects)
    if (answers) {
      // 1. Mood
      const moodKeys = ['mood', 'summary_mood', 'מצב רוח'];
      const moodKey = Object.keys(answers).find(k => moodKeys.includes(k));
      if (moodKey && answers[moodKey]) {
        const val = answers[moodKey];
        let rating = 3;
        if (val.includes('מצוין') || val.includes('מצויין')) rating = 5;
        else if (val.includes('על הפנים') || val.includes('רע')) rating = 1;
        else if (val.includes('טוב') || val.includes('סביר')) rating = 3;

        await prisma.moodCheck.create({
          data: {
            tenantId: auth.tenantId,
            userId: auth.userId,
            frequency: 'daily',
            ratingType: '1to5',
            ratingValue: rating,
            trendStatus: rating > 3 ? 'up' : rating < 3 ? 'down' : 'stable',
            explanation: 'מתוך משו"ב מסע: ' + station.title
          }
        });
      }

      // 2. Goals
      const goalKeys = ['goal_1', 'goal_2', 'goal_3', 'יעד_1'];
      for (const key of goalKeys) {
        if (answers[key] && answers[key].trim().length > 0) {
          await prisma.goal.create({
            data: {
              tenantId: auth.tenantId,
              userId: auth.userId,
              title: answers[key].trim(),
              targetDateType: 'yearly',
              reminderFrequency: 'monthly',
              isPrivate: false,
              isVault: false,
              status: 'active'
            }
          });
        }
      }
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
