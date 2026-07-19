const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.user.findMany({
      where: { 
        tenantId: '1',
        status: { not: 'deleted' },
        role: 'student'
      },
      include: { 
        class: true, 
        managedGroups: true,
        customRole: true,
        groupMemberships: { include: { group: true } }
      },
      orderBy: { fullName: 'asc' }
    });
    console.log(`Found ${users.length} users`);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
check();
