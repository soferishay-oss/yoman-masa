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

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { currentAcademicYear: true }
    });

    const currentYear = tenant?.currentAcademicYear;
    
    let dateFilter = {};
    if (currentYear) {
      dateFilter = {
        createdAt: {
          gte: currentYear.startDate,
          lte: currentYear.endDate
        }
      };
    }

    const alerts = await prisma.staffAlert.findMany({
      where: { 
        tenantId, 
        isArchived: false,
        ...dateFilter
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to recent alerts
    });
    
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
