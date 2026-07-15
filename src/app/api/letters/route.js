import { NextResponse }
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth'; from 'next/server';
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
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    const tenantId = auth?.tenantId;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, recipientId, mediaUrls, aiTranscription, aiThought } = await request.json();

    if (!content && !(mediaUrls && mediaUrls.length > 0)) {
      return NextResponse.json({ error: 'Missing content or media' }, { status: 400 });
    }

    const newLetter = await prisma.letter.create({
      data: {
        content: content || '',
        authorId: userId,
        recipientId,
        tenantId,
        mediaUrls: mediaUrls || [],
        aiTranscription: aiTranscription || null,
        aiThought: aiThought || null
      }
    });

    return NextResponse.json(newLetter, { status: 201 });
  } catch (error) {
    console.error('Failed to create letter:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
