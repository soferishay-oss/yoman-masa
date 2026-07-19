import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const tenantId = auth?.tenantId;
    const role = auth?.role?.toLowerCase();

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { name, permissions, type } = await request.json();

    const dataToUpdate = {
      name,
      permissions: JSON.stringify(permissions || [])
    };
    if (type) dataToUpdate.type = type;

    const updatedRole = await prisma.customRole.update({
      where: { id, tenantId },
      data: dataToUpdate
    });

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error('Failed to update custom role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const tenantId = auth?.tenantId;
    const role = auth?.role?.toLowerCase();

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if role is in use
    const usersCount = await prisma.user.count({
      where: { customRoleId: id, tenantId }
    });

    if (usersCount > 0) {
      return NextResponse.json({ error: 'Cannot delete a role that is assigned to users' }, { status: 400 });
    }

    await prisma.customRole.delete({
      where: { id, tenantId }
    });

    return NextResponse.json({ message: 'Role deleted' });
  } catch (error) {
    console.error('Failed to delete custom role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
