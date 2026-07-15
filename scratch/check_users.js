const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.user.count();
  console.log('Total users:', count);
  const users = await prisma.user.findMany({
    select: {
      id: true,
      phone: true,
      role: true,
      fullName: true
    }
  });
  console.log(users);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
