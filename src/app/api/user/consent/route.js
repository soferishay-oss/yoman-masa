import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { agreedToTerms: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Consent error:', error);
    return NextResponse.json({ error: 'Failed to update consent' }, { status: 500 });
  }
}
