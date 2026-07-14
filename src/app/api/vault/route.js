import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vaultItems = await prisma.contentEntry.findMany({
      where: { 
        tenantId,
        ownerUserId: userId,
        isVault: true 
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(vaultItems);
  } catch (error) {
    console.error('Failed to fetch vault items:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entryId, isVault } = await request.json();

    if (!entryId || isVault === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure the entry belongs to the user
    const updatedEntry = await prisma.contentEntry.update({
      where: { 
        id: entryId,
        ownerUserId: userId // security check
      },
      data: { isVault }
    });

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Failed to update vault status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
