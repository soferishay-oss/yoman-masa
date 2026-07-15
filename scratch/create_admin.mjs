import 'dotenv/config';
import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const pool = new Pool({ connectionString: url });

async function createAdmin() {
  const checkTenant = await pool.query('SELECT id FROM "Tenant" LIMIT 1;');
  const tenantId = checkTenant.rows[0].id;
  
  const insertUser = `
    INSERT INTO "User" ("id", "tenantId", "fullName", "phoneNumber", "email", "passwordHash", "role", "status", "createdAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING id, "fullName";
  `;
  const resUser = await pool.query(insertUser, [
    crypto.randomUUID(),
    tenantId,
    'מנהל המערכת',
    '0500000000',
    'admin@example.com',
    '$2b$10$Be8fINqpDeZUgDG8VQPL7ORaRjsmd0QyCZdYtaQKsqGyzrVqPvn0u', // 123456
    'admin',
    'active'
  ]);
  
  console.log('Created Admin User:', resUser.rows[0]);
}

createAdmin().catch(console.error).finally(() => pool.end());
