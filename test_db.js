const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ include: { group: true, managedGroups: true } });
  console.log('Users:', users.length);
  users.forEach(u => console.log(`${u.fullName} (${u.role}) - group: ${u.groupId}, managed: ${u.managedGroups.map(g => g.id).join(',')}`));
  
  const moods = await prisma.moodCheck.findMany();
  console.log('Moods:', moods.length);
  moods.forEach(m => console.log(`User: ${m.userId}, Value: ${m.ratingValue}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
