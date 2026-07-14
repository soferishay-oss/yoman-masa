import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const posts = await prisma.journalPost.findMany({
      where: {
        authorId: userId,
        tenantId: tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        mood: true,
        tags: true,
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
    const { content, moodId, isDraft } = data;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const newPost = await prisma.journalPost.create({
      data: {
        content,
        isDraft: isDraft || false,
        authorId: userId,
        tenantId: tenantId,
        moodId: moodId || null,
        // tags could be handled here if added in UI
      },
      include: {
        mood: true,
      }
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Failed to create journal post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
