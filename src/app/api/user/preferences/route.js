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

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true }
    });

    return NextResponse.json(user?.preferences || {});
  } catch (error) {
    console.error('Failed to fetch user preferences:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const newPreferences = await request.json();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const currentPrefs = typeof user.preferences === 'object' && user.preferences !== null ? user.preferences : {};

    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: { ...currentPrefs, ...newPreferences }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update user preferences:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
