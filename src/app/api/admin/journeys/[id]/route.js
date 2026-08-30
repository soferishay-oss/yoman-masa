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
    if (!auth || !['admin', 'staff', 'owner'].includes(auth.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const journey = await prisma.journey.findUnique({
      where: { id, tenantId: auth.tenantId },
      include: {
        stations: {
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { responses: true } }
          }
        }
      }
    });

    if (!journey) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json(journey);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    if (!auth || !['admin', 'staff', 'owner'].includes(auth.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description } = await request.json();

    const journey = await prisma.journey.updateMany({
      where: { id, tenantId: auth.tenantId },
      data: { title, description }
    });

    if (journey.count === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    if (!auth || !['admin', 'staff', 'owner'].includes(auth.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.journey.deleteMany({
      where: { id, tenantId: auth.tenantId }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
