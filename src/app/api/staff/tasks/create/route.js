import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    const tenantId = auth?.tenantId;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is staff or admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, type, content, checklistItems, mediaUrls, requireCompletion, timerDeadline, dateMode, targetAudience } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create the Task
    const taskData = {
      tenantId,
      creatorUserId: userId,
      title,
      type,
      content: content || null,
      checklistItems: checklistItems || null,
      mediaUrls: mediaUrls || null,
      requireCompletion: requireCompletion ?? true,
      dateMode: dateMode || 'gregorian',
      targetAudience: targetAudience || { type: 'all' },
    };

    if (timerDeadline) {
      taskData.timerDeadline = new Date(timerDeadline);
    }

    const newTask = await prisma.task.create({ data: taskData });

    // 2. Fetch target users to create TaskAssignments
    let targetUsers = [];
    if (targetAudience && targetAudience.groupId) {
       targetUsers = await prisma.user.findMany({
         where: { tenantId, groupId: targetAudience.groupId, role: 'student', status: 'active' }
       });
    } else {
       targetUsers = await prisma.user.findMany({
         where: { tenantId, role: 'student', status: 'active' }
       });
    }

    // 3. Create assignments
    if (targetUsers.length > 0) {
      const assignments = targetUsers.map(u => ({
        taskId: newTask.id,
        userId: u.id,
        status: 'assigned',
        checklistState: type === 'checklist' ? {} : null
      }));
      await prisma.taskAssignment.createMany({ data: assignments });
    }

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
