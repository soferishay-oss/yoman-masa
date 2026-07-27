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

    const goals = await prisma.goal.findMany({
      where: {
        userId,
        tenantId,
        status: 'active'
      },
      include: {
        updates: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Failed to fetch goals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    const tenantId = auth?.tenantId;

    if (!userId || !tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, targetDateType, reminderFrequency, isPrivate } = await request.json();

    if (!title || !targetDateType || !reminderFrequency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newGoal = await prisma.goal.create({
      data: {
        tenantId,
        userId,
        title,
        targetDateType,
        reminderFrequency,
        isPrivate: isPrivate || false
      }
    });

    const frequencyMap = {
      'daily': 'תזכורת יומית',
      'weekly': 'תזכורת שבועית',
      'monthly': 'תזכורת חודשית'
    };
    
    const targetMap = {
      'weekly': 'שבועי',
      'monthly': 'חודשי',
      'trimester': 'טרימסטר',
      'semester': 'מחצית',
      'yearly': 'שנתי',
      'two_years': 'שנתיים',
      'lifetime': 'לחיים'
    };

    await prisma.contentEntry.create({
      data: {
        tenantId,
        ownerUserId: userId,
        category: 'goal',
        type: 'journal',
        title: title,
        bodyText: `הצבתי לעצמי יעד חדש: ${title}\n(תזמון יעד: ${targetMap[targetDateType] || targetDateType}, ${frequencyMap[reminderFrequency] || reminderFrequency})`,
        visibility: isPrivate ? 'private' : 'staff'
      }
    });

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    console.error('Failed to create goal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
