const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  console.log('[DB] New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
});

async function connectDB() {
  let retries = 5;
  while (retries > 0) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as now');
      console.log('[DB] Connected successfully at:', result.rows[0].now);
      client.release();
      console.log('[DB] Schema managed by Supabase — skipping auto-create');
      return true;
    } catch (err) {
      retries--;
      console.error(`[DB] Connection failed (${retries} retries left):`, err.message);
      if (retries === 0) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query, connectDB };
