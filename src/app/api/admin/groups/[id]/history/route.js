import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const tenantId = auth?.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const histories = await prisma.groupYearHistory.findMany({
      where: { groupId: id },
      include: {
        academicYear: true
      },
      orderBy: {
        academicYear: { startDate: 'desc' }
      }
    });

    return NextResponse.json(histories);
  } catch (error) {
    console.error('Failed to fetch group history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
