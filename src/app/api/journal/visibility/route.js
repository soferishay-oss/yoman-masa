import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entryId, visibility } = await request.json();

    if (!entryId || !visibility) {
      return NextResponse.json({ error: 'Missing entryId or visibility' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.contentEntry.findUnique({
      where: { id: entryId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    if (existing.ownerUserId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.contentEntry.update({
      where: { id: entryId },
      data: { visibility }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update visibility:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
