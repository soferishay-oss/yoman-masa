import pg from 'pg';
import crypto from 'crypto';

const { Client } = pg;

const connectionString = "postgresql://neondb_owner:npg_GBD98KoasOLf@ep-raspy-wildflower-atzwinmi-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log('Seeding via raw PG...');

    let tenantId;
    const checkTenant = await client.query('SELECT id FROM "Tenant" LIMIT 1;');
    if (checkTenant.rows.length > 0) {
      tenantId = checkTenant.rows[0].id;
      console.log('Found existing Tenant:', tenantId);
    } else {
      tenantId = crypto.randomUUID();
      const insertTenant = `
        INSERT INTO "Tenant" ("id", "name", "logoUrl", "slogan", "dominantDateMode", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, name;
      `;
      const resTenant = await client.query(insertTenant, [
        tenantId,
        'מכינה קד"צ טכנולוגית אמי"ת',
        '',
        'באמונה הם עושים',
        'hebrew'
      ]);
      console.log('Created Tenant:', resTenant.rows[0]);
    }

    // Create User Israel Israeli
    const userId = crypto.randomUUID();
    // $2b$10$Be8fINqpDeZUgDG8VQPL7ORaRjsmd0QyCZdYtaQKsqGyzrVqPvn0u is 123456
    const insertUser = `
      INSERT INTO "User" ("id", "tenantId", "fullName", "phoneNumber", "email", "passwordHash", "role", "status", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, "fullName";
    `;
    const resUser = await client.query(insertUser, [
      userId,
      tenantId,
      'ישראל ישראלי',
      '0501234567',
      'israel@example.com',
      '$2b$10$Be8fINqpDeZUgDG8VQPL7ORaRjsmd0QyCZdYtaQKsqGyzrVqPvn0u',
      'student',
      'active'
    ]);
    console.log('Created User:', resUser.rows[0]);

    console.log('Seeding successful!');
  } catch (err) {
    console.error('Error seeding:', err);
  } finally {
    await client.end();
  }
}

main();
