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

    const years = await prisma.academicYear.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' }
    });

    return NextResponse.json(years);
  } catch (error) {
    console.error('Failed to fetch academic years:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
