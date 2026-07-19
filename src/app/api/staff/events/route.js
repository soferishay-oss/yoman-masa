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

    const events = await prisma.event.findMany({
      where: { tenantId },
      orderBy: { scheduledDate: 'asc' }
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to fetch events:', error);
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

    const { title, type, subtitle, color, scheduledDate, endDate, location, targetAudience, showOnCalendar } = await request.json();

    const newEvent = await prisma.event.create({
      data: {
        title, type, subtitle, color, scheduledDate, endDate, location,
        targetAudience: targetAudience || null,
        showOnCalendar: showOnCalendar !== undefined ? showOnCalendar : true,
        tenantId, creatorId: userId
      }
    });

    // Update the color mapping in Tenant themeConfig if it's a valid type
    if (type && type !== 'אחר') {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      const themeConfig = typeof tenant.themeConfig === 'object' && tenant.themeConfig !== null ? tenant.themeConfig : {};
      
      const eventTypeColors = themeConfig.eventTypeColors || {};
      if (eventTypeColors[type] !== color) {
        eventTypeColors[type] = color;
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { themeConfig: { ...themeConfig, eventTypeColors } }
        });
      }
    }

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Failed to create event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
