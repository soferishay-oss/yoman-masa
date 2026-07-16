import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function PUT(request, { params }) {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const { id } = params;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reactions } = body;

    const letter = await prisma.letter.findUnique({
      where: { id }
    });

    if (!letter || letter.recipientId !== userId) {
      return NextResponse.json({ error: 'Letter not found or access denied' }, { status: 403 });
    }

    const updated = await prisma.letter.update({
      where: { id },
      data: {
        reactions
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating letter:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
