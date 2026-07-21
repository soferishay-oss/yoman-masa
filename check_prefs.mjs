import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'student' },
    select: {
      id: true,
      fullName: true,
      preferences: true,
      moodChecks: { select: { createdAt: true }, take: 1, orderBy: { createdAt: 'desc' } }
    }
  });
  console.log(JSON.stringify(users, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
