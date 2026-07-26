import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.tenant.updateMany({ data: { institutionCode: '444364' } });
  console.log('Updated tenants');
}

main().catch(console.error).finally(() => prisma.$disconnect());
