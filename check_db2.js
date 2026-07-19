import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log('Tenants:', tenants.map(t => ({ id: t.id, name: t.name, currentYearId: t.currentAcademicYearId })));

  const years = await prisma.academicYear.findMany();
  console.log('Years:', years);

  const groups = await prisma.group.findMany({ include: { managers: true } });
  console.log('Groups:', groups.map(g => ({ id: g.id, name: g.name, managers: g.managers.map(m => m.fullName) })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
