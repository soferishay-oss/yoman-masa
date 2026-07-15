const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { role: true, phoneNumber: true } });
  const admin = users.find(u => u.role === 'admin');
  console.log('Admin:', admin);
}
main().catch(console.error).finally(() => prisma.$disconnect());
