import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const { Pool } = pg;
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const count = await prisma.user.count();
  console.log('Total users:', count);
  const users = await prisma.user.findMany({
    select: { id: true, phone: true, role: true, fullName: true, tenantId: true }
  });
  console.log(users);
}

check().catch(console.error).finally(() => prisma.$disconnect());
