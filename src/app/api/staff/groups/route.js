import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const tenantId = auth?.tenantId;
    const role = auth?.role?.toLowerCase();

    if (!tenantId || (role !== 'admin' && role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (role === 'admin') {
      const groups = await prisma.group.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' }
      });
      return NextResponse.json(groups);
    } else {
      const authUserId = auth.userId;
      const staff = await prisma.user.findUnique({
        where: { id: authUserId },
        select: { 
          classId: true, 
          managedGroups: { select: { id: true, name: true } },
          groupMemberships: { select: { group: { select: { id: true, name: true } } } },
          class: { select: { id: true, name: true } }
        }
      });

      const uniqueGroups = new Map();
      if (staff?.class) uniqueGroups.set(staff.class.id, staff.class);
      if (staff?.managedGroups) {
        staff.managedGroups.forEach(g => uniqueGroups.set(g.id, g));
      }
      if (staff?.groupMemberships) {
        staff.groupMemberships.forEach(m => uniqueGroups.set(m.group.id, m.group));
      }

      const groups = Array.from(uniqueGroups.values()).sort((a, b) => a.name.localeCompare(b.name));
      return NextResponse.json(groups);
    }
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
