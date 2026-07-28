import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

    const data = await request.json();
    const { title, isPrivate, reminderFrequency, isVault } = data;

    const goal = await prisma.goal.findUnique({
      where: { id }
    });

    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const updates = {};
    if (title && title.trim()) updates.title = title.trim();
    if (typeof isPrivate === 'boolean') updates.isPrivate = isPrivate;
    if (typeof isVault === 'boolean') updates.isVault = isVault;
    if (reminderFrequency) updates.reminderFrequency = reminderFrequency;
    
    // Update goal
    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: updates
    });

    // Create a GoalUpdate saying it was renamed if title changed
    if (updates.title && updates.title !== goal.title) {
        const reflectionText = `שם היעד עודכן מ-"${goal.title}" ל-"${updates.title}"`;
        
        await prisma.goalUpdate.create({
          data: {
            goalId: goal.id,
            rating: 2, // Neutral
            reflection: reflectionText
          }
        });

        // Create ContentEntry for the journal
        await prisma.contentEntry.create({
          data: {
            tenantId,
            ownerUserId: userId,
            category: 'goal',
            type: 'journal',
            title: updates.title,
            bodyText: reflectionText,
            visibility: updatedGoal.isPrivate ? 'private' : 'staff'
          }
        });
    }

    return NextResponse.json(updatedGoal, { status: 200 });
  } catch (error) {
    console.error('Failed to update goal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
