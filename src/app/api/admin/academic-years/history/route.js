import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const tenantId = auth?.tenantId;
    const role = auth?.role?.toLowerCase();

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all academic years for this tenant, ordered by start date descending
    const academicYears = await prisma.academicYear.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
      include: {
        groupHistories: {
          orderBy: { groupName: 'asc' }
        }
      }
    });

    return NextResponse.json(academicYears);
  } catch (error) {
    console.error('Failed to fetch academic years history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
