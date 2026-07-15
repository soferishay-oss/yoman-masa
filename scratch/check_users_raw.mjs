import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const pool = new Pool({ connectionString: url });

async function check() {
  const { rows } = await pool.query('SELECT id, phone, role, "fullName" FROM "User"');
  console.log('Total users:', rows.length);
  console.log(rows);
}

check().catch(console.error).finally(() => pool.end());
