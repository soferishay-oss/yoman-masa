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
    const tenantId = auth?.tenantId;
    
    // Admin/Staff can request any student's book, Student can request their own
    // For simplicity in this endpoint, we'll assume the requester wants their own book
    // To support admin/staff, we would read a `?studentId=` from URL.
    const { searchParams } = new URL(request.url);
    const targetStudentId = searchParams.get('studentId') || userId;
    const role = auth?.role;

    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Access control:
    if (targetStudentId !== userId && role !== 'admin' && role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const student = await prisma.user.findUnique({
      where: { id: targetStudentId, tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const vaultItems = await prisma.contentEntry.findMany({
      where: { 
        tenantId,
        ownerUserId: targetStudentId,
        isVault: true 
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({
      student,
      bookTitle: `המסע של ${student.firstName} ${student.lastName}`,
      entries: vaultItems
    });
  } catch (error) {
    console.error('Failed to generate book report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
