import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const { Pool } = pg;

let prisma;

if (process.env.NODE_ENV === 'production') {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
}

export default prisma;
