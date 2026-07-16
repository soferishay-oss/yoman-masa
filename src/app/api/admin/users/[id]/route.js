import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const tenantId = auth?.tenantId;
    const role = auth?.role?.toLowerCase();
    
    const { id } = await params;

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
    if (data.password !== undefined) updateData.password = data.password;
    if (data.username !== undefined) updateData.username = data.username;
    
    // Determine the role for checking if managedGroups should be updated
    const finalRole = updateData.role || (await prisma.user.findUnique({ where: { id } }))?.role;
    
    if ((finalRole === 'staff' || finalRole === 'admin') && data.managedGroupIds !== undefined) {
      updateData.managedGroups = {
        set: data.managedGroupIds.map(id => ({ id }))
      };
    }

    const updatedUser = await prisma.user.update({
      where: { 
        id,
        tenantId // ensure they only update users in their tenant
      },
      data: updateData,
      include: { group: true, managedGroups: true }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user:', error);
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
    
    const { id } = await params;

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete by updating status to 'deleted'
    await prisma.user.update({
      where: { 
        id,
        tenantId
      },
      data: { status: 'deleted' }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
