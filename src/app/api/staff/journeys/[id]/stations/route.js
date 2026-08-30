import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request, { params }) {
  try {
    const { id: journeyId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    if (!auth || !['admin', 'staff', 'owner'].includes(auth.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, questions } = await request.json();
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Verify journey belongs to tenant
    const journey = await prisma.journey.findUnique({ where: { id: journeyId, tenantId: auth.tenantId } });
    if (!journey) return NextResponse.json({ error: 'Journey not found' }, { status: 404 });

    const station = await prisma.journeyStation.create({
      data: {
        journeyId,
        title,
        description,
        questions: questions || []
      }
    });

    return NextResponse.json(station);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
