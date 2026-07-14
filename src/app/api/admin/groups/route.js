import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const role = request.headers.get('x-user-role');

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groups = await prisma.group.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const role = request.headers.get('x-user-role');

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, type, description } = data;

    if (!name || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newGroup = await prisma.group.create({
      data: {
        tenantId,
        name,
        type,
        description: description || null
      }
    });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error('Failed to create group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
