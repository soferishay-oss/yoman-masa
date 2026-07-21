import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: { in: ['staff', 'admin'] } },
    include: { managedGroups: true, class: true }
  });
  console.dir(users, { depth: null });
}

main().finally(() => prisma.$disconnect());
