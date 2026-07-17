import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = auth.tenantId;

    // 1. Get user counts
    const totalStudents = await prisma.user.count({ where: { tenantId, role: 'student' } });
    const totalStaff = await prisma.user.count({ where: { tenantId, role: 'staff' } });
    const totalGroups = await prisma.group.count({ where: { tenantId } });

    // 2. Get today's mood distribution
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysMoods = await prisma.moodCheck.findMany({
      where: {
        tenantId,
        createdAt: { gte: startOfDay, lte: endOfDay }
      },
      select: { ratingValue: true }
    });

    const moodDistribution = [
      { name: 'מעולה (5)', value: todaysMoods.filter(m => m.ratingValue === 5).length, color: '#22c55e' },
      { name: 'טוב (4)', value: todaysMoods.filter(m => m.ratingValue === 4).length, color: '#84cc16' },
      { name: 'בסדר (3)', value: todaysMoods.filter(m => m.ratingValue === 3).length, color: '#eab308' },
      { name: 'ככה-ככה (2)', value: todaysMoods.filter(m => m.ratingValue === 2).length, color: '#f97316' },
      { name: 'קשה (1)', value: todaysMoods.filter(m => m.ratingValue === 1).length, color: '#ef4444' },
    ];

    const needsAttentionCount = todaysMoods.filter(m => m.ratingValue <= 2).length;

    // 3. Get upcoming event stats
    const upcomingEvent = await prisma.event.findFirst({
      where: {
        tenantId,
        status: 'upcoming',
        scheduledDate: { gte: new Date() }
      },
      orderBy: { scheduledDate: 'asc' },
      include: {
        rsvps: true
      }
    });

    let eventStats = null;
    if (upcomingEvent) {
      eventStats = {
        title: upcomingEvent.title,
        date: upcomingEvent.scheduledDate,
        totalRsvps: upcomingEvent.rsvps.length,
        attending: upcomingEvent.rsvps.filter(r => r.status === 'attending').length,
        declined: upcomingEvent.rsvps.filter(r => r.status === 'declined').length,
        present: upcomingEvent.rsvps.filter(r => r.status === 'present').length,
        pending: upcomingEvent.rsvps.filter(r => r.status === 'pending').length,
      };
    }

    return NextResponse.json({
      stats: {
        totalStudents,
        totalStaff,
        totalGroups,
        todaysMoods: todaysMoods.length,
        needsAttentionCount
      },
      moodDistribution,
      upcomingEvent: eventStats
    });

  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
