import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fixDB() {
  const currentTashpav = await prisma.academicYear.findFirst({
    where: { name: 'תשפ״ו' }
  });

  const tashpah = await prisma.academicYear.findFirst({
    where: { name: 'תשפ״ה' }
  });

  if (currentTashpav && tashpah) {
    const tenants = await prisma.tenant.findMany();
    for (const t of tenants) {
      if (t.currentAcademicYearId === currentTashpav.id) {
        await prisma.tenant.update({
          where: { id: t.id },
          data: { currentAcademicYearId: tashpah.id }
        });
      }
    }

    await prisma.academicYear.update({
      where: { id: tashpah.id },
      data: { isCurrent: true }
    });

    await prisma.groupYearHistory.deleteMany({
      where: { academicYearId: tashpah.id }
    });

    await prisma.academicYear.delete({
      where: { id: currentTashpav.id }
    });

    console.log("DB is reset to תשפ״ה.");
  } else {
    console.log("Could not find both years.");
  }
}

fixDB().catch(console.error).finally(() => prisma.$disconnect());
