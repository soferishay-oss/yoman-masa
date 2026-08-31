import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request, { params }) {
  try {
    const { id: studentId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const staffId = auth?.userId;
    const tenantId = auth?.tenantId;
    const role = auth?.role;

    if (!staffId || !tenantId || (role !== 'admin' && role !== 'staff' && role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.user.findUnique({
      where: { 
        id: studentId,
        tenantId: tenantId
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const defaultPasswordHash = await bcrypt.hash('123456', 10);

    await prisma.user.update({
      where: { id: studentId },
      data: { 
        passwordHash: defaultPasswordHash,
        forcePasswordChange: true 
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reset student password:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
