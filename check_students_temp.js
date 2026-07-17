const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({ where: { role: 'student' } });
  console.log(users.map(u => ({ id: u.id, fullName: u.fullName })));
  await prisma.$disconnect();
}
check();
