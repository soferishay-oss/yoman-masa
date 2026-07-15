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
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real app, tasks would be assigned to users or groups.
    // For this prototype, we'll just fetch tasks in the tenant that are open
    const tasks = await prisma.task.findMany({
      where: { tenantId, status: 'open' },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tasks);
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

    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Mark as complete. In reality, we'd want a UserTask table to track per-user completion.
    // For now we'll just close the task.
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: 'completed' }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Failed to complete task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
