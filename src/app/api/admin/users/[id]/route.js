import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const role = request.headers.get('x-user-role');
    const { id } = params;

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const updateData = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.subRole !== undefined) updateData.subRole = data.subRole || null;
    if (data.classId !== undefined) updateData.classId = data.classId || null;
    if (data.groupId !== undefined) updateData.groupId = data.groupId || null;
    if (data.status !== undefined) updateData.status = data.status;

    const updatedUser = await prisma.user.update({
      where: { 
        id,
        tenantId // ensure they only update users in their tenant
      },
      data: updateData,
      include: { group: true }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const role = request.headers.get('x-user-role');
    const { id } = params;

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user.delete({
      where: { 
        id,
        tenantId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
