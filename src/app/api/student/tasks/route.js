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
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignments = await prisma.taskAssignment.findMany({
      where: { 
        userId, 
        status: { in: ['assigned', 'opened'] } 
      },
      include: {
        task: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    
    // Filter tasks if they are linked to an event and not yet due
    const validAssignments = [];
    for (const assignment of assignments) {
      if (assignment.task.linkedEventId) {
        const event = await prisma.event.findUnique({ where: { id: assignment.task.linkedEventId } });
        if (event) {
          const targetDate = new Date(event.scheduledDate);
          if (assignment.task.relativeDaysToEvent) {
            targetDate.setDate(targetDate.getDate() + assignment.task.relativeDaysToEvent);
          }
          if (now < targetDate) {
            continue; // Skip this assignment, it's not time yet
          }
        }
      }
      validAssignments.push(assignment);
    }

    return NextResponse.json(validAssignments);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
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

    const { assignmentId, status, checklistState } = await request.json();

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }
    
    const updateData = { status };
    if (status === 'completed') updateData.completedAt = new Date();
    if (status === 'opened') updateData.openedAt = new Date();
    if (checklistState) updateData.checklistState = checklistState;

    const updatedAssignment = await prisma.taskAssignment.update({
      where: { id: assignmentId, userId },
      data: updateData
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
