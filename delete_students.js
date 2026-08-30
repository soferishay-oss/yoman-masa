const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});
async function main() {
  const count = await prisma.user.deleteMany({ where: { role: 'student' } });
  console.log('Deleted ' + count.count + ' students.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
