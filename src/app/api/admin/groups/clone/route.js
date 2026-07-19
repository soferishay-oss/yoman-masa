import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const tenantId = auth?.tenantId;
    const role = auth?.role?.toLowerCase();

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const groupToClone = await prisma.group.findUnique({
      where: { id: groupId, tenantId },
      include: {
        managers: true,
        groupMembers: true,
      }
    });

    if (!groupToClone) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Create a new group
    const newGroup = await prisma.group.create({
      data: {
        name: `${groupToClone.name} (עותק)`,
        type: groupToClone.type,
        description: groupToClone.description,
        tenantId: tenantId,
        managers: {
          connect: groupToClone.managers.map(m => ({ id: m.id }))
        },
        groupMembers: {
          create: groupToClone.groupMembers.map(gm => ({
            userId: gm.userId,
            isDutyStudent: gm.isDutyStudent,
            dutyRoleId: gm.dutyRoleId
          }))
        }
      }
    });

    return NextResponse.json(newGroup);
  } catch (error) {
    console.error('Failed to clone group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
