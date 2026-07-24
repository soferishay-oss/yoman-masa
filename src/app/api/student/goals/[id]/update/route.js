import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request, context) {
  const params = await context.params;
  const goalId = params.id;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    const tenantId = auth?.tenantId;

    if (!userId || !tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify goal belongs to user
    const goal = await prisma.goal.findUnique({
      where: { id: goalId }
    });

    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const { rating, reflection } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating (must be 1-5)' }, { status: 400 });
    }

    const goalUpdate = await prisma.goalUpdate.create({
      data: {
        goalId,
        rating,
        reflection
      }
    });

    // Also update the goal's updatedAt field
    await prisma.goal.update({
      where: { id: goalId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json(goalUpdate, { status: 201 });
  } catch (error) {
    console.error('Failed to update goal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
