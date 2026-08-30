import prisma from './src/lib/prisma.js';

async function main() {
  const count = await prisma.user.deleteMany({ where: { role: 'student' } });
  console.log('Deleted ' + count.count + ' students.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
