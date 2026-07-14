import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');

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
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');

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
