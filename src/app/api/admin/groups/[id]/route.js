import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
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

    const group = await prisma.group.findUnique({
      where: { id, tenantId },
      include: {
        classUsers: {
          select: { id: true, fullName: true, phoneNumber: true }
        },
        groupMembers: {
          include: {
            user: { select: { id: true, fullName: true, phoneNumber: true } }
          }
        }
      }
    });

    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Format the response so UI has an easy time
    let members = [];
    if (group.type === 'class') {
      members = group.classUsers.map(u => {
        const dutyRecord = group.groupMembers.find(gm => gm.userId === u.id && gm.isDutyStudent);
        return { ...u, isDutyStudent: !!dutyRecord };
      });
    } else {
      members = group.groupMembers.map(gm => ({ ...gm.user, isDutyStudent: gm.isDutyStudent }));
    }

    return NextResponse.json({ ...group, members });
  } catch (error) {
    console.error('Failed to fetch group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    // We'll handle the student assignment explicitly after updating the group basics
    const updatedGroup = await prisma.group.update({
      where: { id, tenantId },
      data: updateData,
      include: {
        managers: { select: { id: true, fullName: true } }
      }
    });

    // Handle student assignments
    if (studentIds && Array.isArray(studentIds)) {
      if (updatedGroup.type === 'class') {
        // Disconnect users currently in this class but not in studentIds
        await prisma.user.updateMany({
          where: { tenantId, classId: id, id: { notIn: studentIds } },
          data: { classId: null }
        });
        // Connect new users to this class
        if (studentIds.length > 0) {
          await prisma.user.updateMany({
            where: { tenantId, id: { in: studentIds } },
            data: { classId: id }
          });
        }
      } else {
        // Group type: use GroupMember
        // Remove existing members not in studentIds
        await prisma.groupMember.deleteMany({
          where: { groupId: id, userId: { notIn: studentIds } }
        });
        
        // Add new members
        // To avoid conflicts, we only create missing ones. 
        // A simple way is to delete all and recreate, but we don't want to lose isDutyStudent status.
        // Let's find existing first.
        const existingMembers = await prisma.groupMember.findMany({
          where: { groupId: id }
        });
        const existingIds = new Set(existingMembers.map(m => m.userId));
        
        const newIds = studentIds.filter(userId => !existingIds.has(userId));
        if (newIds.length > 0) {
          await prisma.groupMember.createMany({
            data: newIds.map(userId => ({
              groupId: id,
              userId: userId,
              isDutyStudent: false
            }))
          });
        }
      }
    }

    // Handle duty students
    if (dutyStudentIds && Array.isArray(dutyStudentIds)) {
      await prisma.groupMember.updateMany({
        where: { groupId: id },
        data: { isDutyStudent: false }
      });
      if (dutyStudentIds.length > 0) {
        for (const uid of dutyStudentIds) {
          await prisma.groupMember.upsert({
            where: {
              userId_groupId: {
                userId: uid,
                groupId: id
              }
            },
            update: { isDutyStudent: true },
            create: {
              userId: uid,
              groupId: id,
              isDutyStudent: true
            }
          });
        }
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
