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
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const now = new Date();
    const dueGoals = [];

    for (const goal of goals) {
      if (goal.reminderFrequency === 'custom') continue; // Not implemented yet

      const lastUpdate = goal.updates.length > 0 ? new Date(goal.updates[0].createdAt) : new Date(goal.createdAt);
      
      let isDue = false;

      if (goal.reminderFrequency === 'weekly') {
        const startOfWeek = new Date(now);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday is 0
        if (lastUpdate < startOfWeek) isDue = true;
      } else if (goal.reminderFrequency === 'monthly') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (lastUpdate < startOfMonth) isDue = true;
      } else if (goal.reminderFrequency === 'daily') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (lastUpdate < startOfDay) isDue = true;
      }

      if (isDue) {
        dueGoals.push(goal);
      }
    }

    return NextResponse.json({ dueGoals });
  } catch (error) {
    console.error('Failed to check goal reminders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
