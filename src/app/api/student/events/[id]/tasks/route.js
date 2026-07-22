import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;

    // We want to fetch all TaskAssignments for this user where the task's linkedEventId matches the given eventId
    const assignments = await prisma.taskAssignment.findMany({
      where: { 
        userId, 
        task: {
          linkedEventId: eventId
        }
      },
      include: {
        task: true
      },
      orderBy: { task: { relativeDaysToEvent: 'asc' } } // Sort by relative timing
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Failed to fetch event tasks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
