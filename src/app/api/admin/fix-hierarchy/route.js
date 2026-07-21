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
    const role = auth?.role?.toLowerCase();

    if (!userId || !tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Only admins can run this.' }, { status: 401 });
    }

    // Downgrade everyone else who has role = 'admin' to 'staff'
    const updated = await prisma.user.updateMany({
      where: {
        tenantId,
        role: 'admin',
        id: { not: userId }
      },
      data: {
        role: 'staff'
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Hierarchy fixed successfully.',
      downgradedCount: updated.count,
      bigBossId: userId
    });
  } catch (error) {
    console.error('Failed to fix hierarchy:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
