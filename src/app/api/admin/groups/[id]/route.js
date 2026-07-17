import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const tenantId = auth?.tenantId;
    const role = auth?.role?.toLowerCase();

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, type, description, managerIds, dutyStudentIds, studentIds } = data;

    const updateData = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (description !== undefined) updateData.description = description;

    // Connect/disconnect managers if provided
    if (managerIds && Array.isArray(managerIds)) {
      updateData.managers = {
        set: managerIds.map(userId => ({ id: userId }))
      };
    }

    // Connect/disconnect students if provided
    if (studentIds && Array.isArray(studentIds)) {
      updateData.users = {
        set: studentIds.map(userId => ({ id: userId }))
      };
    }

    const updatedGroup = await prisma.group.update({
      where: { id, tenantId },
      data: updateData,
      include: {
        managers: { select: { id: true, fullName: true } },
        _count: { select: { users: true } }
      }
    });

    // Handle duty students
    if (dutyStudentIds && Array.isArray(dutyStudentIds)) {
      // First, set all users in this group to isDutyStudent: false
      await prisma.user.updateMany({
        where: { tenantId, groupId: id },
        data: { isDutyStudent: false }
      });
      // Then, set the selected ones to true
      if (dutyStudentIds.length > 0) {
        await prisma.user.updateMany({
          where: { tenantId, id: { in: dutyStudentIds } },
          data: { isDutyStudent: true, groupId: id }
        });
      }
    }

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Failed to update group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const tenantId = auth?.tenantId;
    const role = auth?.role?.toLowerCase();

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.group.delete({
      where: { id, tenantId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
