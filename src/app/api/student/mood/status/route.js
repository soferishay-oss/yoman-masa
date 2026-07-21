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

    const [user, tenant, latestMood] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.moodCheck.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    if (!user || !tenant) {
      return NextResponse.json({ error: 'Data not found' }, { status: 404 });
    }

    // 1. Check for manual staff trigger
    const preferences = user.preferences && typeof user.preferences === 'object' ? user.preferences : {};
    if (preferences.forceMoodSurvey === true) {
      return NextResponse.json({ shouldShow: true, reason: 'forced' });
    }

    // 2. Check tenant schedule
    const schedule = (tenant.themeConfig && tenant.themeConfig.moodSurveySchedule) || 'weekly_first_login';

    if (schedule === 'disabled') {
      return NextResponse.json({ shouldShow: false, reason: 'disabled' });
    }

    const now = new Date();

    if (schedule === 'daily') {
      // Midnight today
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (!latestMood || new Date(latestMood.createdAt) < startOfDay) {
        return NextResponse.json({ shouldShow: true, reason: 'daily' });
      }
    } else if (schedule === 'weekly_first_login') {
      // Midnight of the most recent Sunday
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday is 0

      if (!latestMood || new Date(latestMood.createdAt) < startOfWeek) {
        return NextResponse.json({ shouldShow: true, reason: 'weekly' });
      }
    }

    return NextResponse.json({ shouldShow: false, reason: 'already_submitted' });
  } catch (error) {
    console.error('Failed to check mood status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
