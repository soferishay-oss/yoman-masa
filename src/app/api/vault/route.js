import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    const tenantId = auth?.tenantId;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const journalItems = await prisma.contentEntry.findMany({
      where: { 
        tenantId,
        ownerUserId: userId,
        isVault: true 
      },
      orderBy: { createdAt: 'desc' }
    });

    const letterItems = await prisma.letter.findMany({
      where: {
        tenantId,
        recipientId: userId,
        isVault: true
      },
      include: {
        author: { select: { fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Map letters to match journal format roughly for UI
    const formattedLetters = letterItems.map(letter => ({
      id: letter.id,
      title: `מכתב מ${letter.author?.fullName || 'איש צוות'}`,
      bodyText: letter.content,
      type: 'letter',
      createdAt: letter.createdAt,
      mediaUrls: letter.mediaUrls,
      isVault: letter.isVault
    }));

    const vaultItems = [...journalItems, ...formattedLetters]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json(vaultItems);
  } catch (error) {
    console.error('Failed to fetch vault items:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entryId, isVault, type } = await request.json();

    if (!entryId || isVault === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'letter') {
      const updatedEntry = await prisma.letter.update({
        where: { 
          id: entryId,
          recipientId: userId
        },
        data: { isVault }
      });
      return NextResponse.json(updatedEntry);
    } else {
      const updatedEntry = await prisma.contentEntry.update({
        where: { 
          id: entryId,
          ownerUserId: userId
        },
        data: { isVault }
      });
      return NextResponse.json(updatedEntry);
    }
  } catch (error) {
    console.error('Failed to update vault status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
