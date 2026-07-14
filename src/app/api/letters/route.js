import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const letters = await prisma.letter.findMany({
      where: {
        recipientId: userId,
        tenantId: tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true
          }
        }
      }
    });

    return NextResponse.json(letters);
  } catch (error) {
    console.error('Failed to fetch letters:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Optional POST method if they want to write letters
export async function POST(request) {
  try {
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, recipientId } = await request.json();

    if (!content || !recipientId) {
      return NextResponse.json({ error: 'Missing content or recipient' }, { status: 400 });
    }

    const newLetter = await prisma.letter.create({
      data: {
        content,
        authorId: userId,
        recipientId,
        tenantId
      }
    });

    return NextResponse.json(newLetter, { status: 201 });
  } catch (error) {
    console.error('Failed to create letter:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
