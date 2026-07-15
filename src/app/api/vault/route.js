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
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
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
