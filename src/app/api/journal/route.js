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

    const posts = await prisma.contentEntry.findMany({
      where: {
        ownerUserId: userId,
        tenantId: tenantId,
        type: 'journal'
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Failed to fetch journal posts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    const data = await request.json();
    const { content, title, isDraft, mediaUrls, aiTranscription, aiThought } = data;

    if (!content && !(mediaUrls && mediaUrls.length > 0)) {
      return NextResponse.json({ error: 'Content or media is required' }, { status: 400 });
    }

    const newPost = await prisma.contentEntry.create({
      data: {
        bodyText: content || '',
        title: title || null,
        type: 'journal',
        status: isDraft ? 'draft' : 'published',
        ownerUserId: userId,
        tenantId: tenantId,
        mediaUrls: mediaUrls || [],
        aiTranscription: aiTranscription || null,
        aiThought: aiThought || null,
      }
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Failed to create journal post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
