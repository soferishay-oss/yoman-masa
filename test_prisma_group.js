const prisma = require('./src/lib/prisma').default;

async function main() {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: 'student'
      },
      include: {
        group: true,
        moodChecks: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      take: 1
    });
    console.log("SUCCESS:", JSON.stringify(students, null, 2));
  } catch (err) {
    console.error("PRISMA ERROR:", err);
  } finally {
    if (prisma && typeof prisma.$disconnect === 'function') {
      await prisma.$disconnect();
    }
  }
}

main();
