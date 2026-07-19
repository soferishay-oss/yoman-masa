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

    const { newYearName, startDate, endDate, classesUpdate } = await request.json();

    if (!newYearName || !classesUpdate || !Array.isArray(classesUpdate)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use a transaction to ensure atomic transition
    await prisma.$transaction(async (tx) => {
      // 1. Get the current academic year
      const currentYear = await tx.academicYear.findFirst({
        where: { tenantId, isCurrent: true }
      });

      // 2. Mark old year as not current
      if (currentYear) {
        await tx.academicYear.update({
          where: { id: currentYear.id },
          data: { isCurrent: false }
        });
      }

      // 3. Create the new academic year
      const newYear = await tx.academicYear.create({
        data: {
          tenantId,
          name: newYearName,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isCurrent: true
        }
      });

      // 4. Update tenant's current year pointer
      await tx.tenant.update({
        where: { id: tenantId },
        data: { currentAcademicYearId: newYear.id }
      });

      // 5. Process each class
      for (const cls of classesUpdate) {
        const { id, originalName, newName, managers, archive } = cls;

        // Fetch current managers to save in history
        const currentGroup = await tx.group.findUnique({
          where: { id },
          include: { managers: true }
        });

        if (currentGroup && currentYear) {
          // Create history snapshot for the outgoing year
          const managerNamesStr = currentGroup.managers.map(m => m.fullName).join(', ') || 'ללא מחנך';
          
          // Upsert history in case transition was run multiple times or overlapping
          await tx.groupYearHistory.upsert({
            where: {
              groupId_academicYearId: {
                groupId: id,
                academicYearId: currentYear.id
              }
            },
            create: {
              groupId: id,
              academicYearId: currentYear.id,
              groupName: originalName,
              managerNames: managerNamesStr
            },
            update: {
              groupName: originalName,
              managerNames: managerNamesStr
            }
          });
        }

        // Update the group for the new year
        const type = archive ? 'archived_class' : 'class';
        
        await tx.group.update({
          where: { id },
          data: {
            name: newName,
            type: type,
            managers: {
              set: managers.map(mgrId => ({ id: mgrId }))
            }
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to transition year:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
