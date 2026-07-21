import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const staffId = auth?.userId;
    const role = auth?.role?.toLowerCase();

    if (!staffId || (role !== 'staff' && role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await request.json();
    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const prefs = student.preferences && typeof student.preferences === 'object' ? { ...student.preferences } : {};
    prefs.forceMoodSurvey = true;

    await prisma.user.update({
      where: { id: studentId },
      data: { preferences: prefs }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to trigger mood survey:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
