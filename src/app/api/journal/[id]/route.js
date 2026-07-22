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
    const userId = auth?.userId;
    const tenantId = auth?.tenantId;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await prisma.contentEntry.findUnique({
      where: { id }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.ownerUserId !== userId && auth.role !== 'admin' && auth.role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Failed to fetch journal post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    const tenantId = auth?.tenantId;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const post = await prisma.contentEntry.findUnique({
      where: { id }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.ownerUserId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if 30 minutes have passed since creation/last update
    const now = new Date();
    const timeRef = post.updatedAt ? new Date(post.updatedAt) : new Date(post.createdAt);
    const diffInMinutes = (now - timeRef) / (1000 * 60);

    if (diffInMinutes > 30) {
      return NextResponse.json({ error: 'Cannot edit posts older than 30 minutes' }, { status: 403 });
    }

    const updatedPost = await prisma.contentEntry.update({
      where: { id },
      data: {
        bodyText: body.content,
        mediaUrls: body.mediaUrls || post.mediaUrls,
        aiTranscription: body.aiTranscription !== undefined ? body.aiTranscription : post.aiTranscription,
        updatedAt: new Date() // Reset the 30 minute timer
      }
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Failed to update journal post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    const tenantId = auth?.tenantId;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await prisma.contentEntry.findUnique({
      where: { id }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.ownerUserId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if 30 minutes have passed since creation or last update
    const now = new Date();
    const timeRef = post.updatedAt ? new Date(post.updatedAt) : new Date(post.createdAt);
    const diffInMinutes = (now - timeRef) / (1000 * 60);

    if (diffInMinutes > 30) {
      return NextResponse.json({ error: 'Cannot delete posts older than 30 minutes' }, { status: 403 });
    }

    await prisma.contentEntry.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete journal post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
