import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');
    
    // Admin/Staff can request any student's book, Student can request their own
    // For simplicity in this endpoint, we'll assume the requester wants their own book
    // To support admin/staff, we would read a `?studentId=` from URL.
    const { searchParams } = new URL(request.url);
    const targetStudentId = searchParams.get('studentId') || userId;
    const role = request.headers.get('x-user-role');

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
