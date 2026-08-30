import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const tenantId = auth?.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (id === 'all') {
      await prisma.staffAlert.deleteMany({
        where: { tenantId, isArchived: true }
      });
    } else {
      await prisma.staffAlert.delete({
        where: { id, tenantId }
      });
    }

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Failed to delete alert:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
