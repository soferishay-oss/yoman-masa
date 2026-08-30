import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { agreedToTerms: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Consent error:', error);
    return NextResponse.json({ error: 'Failed to update consent' }, { status: 500 });
  }
}
