import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id: journeyId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    if (!auth || !['admin', 'staff', 'owner'].includes(auth.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const journey = await prisma.journey.findUnique({
      where: { id: journeyId, tenantId: auth.tenantId },
      select: { id: true }
    });
    if (!journey) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    const responses = await prisma.journeyResponse.findMany({
      where: {
        station: {
          journeyId: journeyId
        }
      },
      include: {
        user: { select: { id: true, fullName: true, classId: true, class: { select: { name: true } } } },
        station: { select: { id: true, title: true, order: true } }
      },
      orderBy: [
        { station: { order: 'asc' } },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(responses);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
