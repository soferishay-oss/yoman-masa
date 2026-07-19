const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  if (tenants.length === 0) {
    console.log("No tenants found.");
    return;
  }
  
  const tenant = tenants[0];
  console.log(`Setting up academic year for tenant: ${tenant.name}`);

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
    console.log(`Created academic year ${year.name}`);
  } else {
    console.log(`Academic year ${year.name} already exists.`);
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { currentAcademicYearId: year.id }
  });
  
  console.log("Tenant updated with current academic year.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
