import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany();
    if (tenants.length === 0) {
      return NextResponse.json({ message: "No tenants found." });
    }
    
    const tenant = tenants[0];
    let year = await prisma.academicYear.findFirst({
      where: { tenantId: tenant.id, name: 'תשפ״ה' }
    });

    if (!year) {
      year = await prisma.academicYear.create({
        data: {
          tenantId: tenant.id,
          name: 'תשפ״ה',
          startDate: new Date('2024-09-01T00:00:00.000Z'),
          endDate: new Date('2025-06-30T23:59:59.000Z'),
          isCurrent: true
        }
      });
    }

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { currentAcademicYearId: year.id }
    });
    
    return NextResponse.json({ message: "Tenant updated with current academic year." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
