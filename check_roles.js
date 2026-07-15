const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { role: true } });
  console.log('Roles:', Array.from(new Set(users.map(u => u.role))));
}
main().catch(console.error).finally(() => prisma.$disconnect());
