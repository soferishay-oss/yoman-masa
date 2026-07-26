import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  for (const t of tenants) {
    if (!t.institutionCode) {
      console.log(`Setting institutionCode to '444364' for tenant: ${t.name}`);
      await prisma.tenant.update({
        where: { id: t.id },
        data: { institutionCode: '444364' }
      });
    }
  }
  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
