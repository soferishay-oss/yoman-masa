import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const staffId = auth?.userId;
    const tenantId = auth?.tenantId;
    const role = auth?.role;

    if (!staffId || !tenantId || (role !== 'admin' && role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: studentId } = await params;

    // Fetch student data, ensuring they belong to the same tenant
    const student = await prisma.user.findUnique({
      where: { 
        id: studentId,
        tenantId: tenantId
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        avatarUrl: true,
        class: { select: { id: true, name: true } },
        groupMemberships: {
          include: { group: { select: { id: true, name: true, type: true } } }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch latest mood checks
    const moods = await prisma.moodCheck.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Fetch shared journal entries
    const sharedEntries = await prisma.contentEntry.findMany({
      where: { 
        ownerUserId: studentId,
        visibility: 'staff'
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch tasks assignments
    const assignments = await prisma.taskAssignment.findMany({
      where: { userId: studentId },
      include: { task: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      student,
      moods,
      sharedEntries,
      assignments
    });
  } catch (error) {
    console.error('Failed to fetch student profile for staff:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
