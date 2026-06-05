const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
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
      await initializeSchema();
      return true;
    } catch (err) {
      retries--;
      console.error(`[DB] Connection failed (${retries} retries left):`, err.message);
      if (retries === 0) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function initializeSchema() {
  const schema = `
    CREATE TABLE IF NOT EXISTS waitlist (
      id             SERIAL PRIMARY KEY,
      name           VARCHAR(100)  NOT NULL,
      phone          VARCHAR(15)   NOT NULL,
      service        VARCHAR(50),
      email          VARCHAR(255),
      business_name  VARCHAR(255),
      plan           VARCHAR(50)   DEFAULT 'Starter',
      promoter_code  VARCHAR(100),
      city           VARCHAR(100)  DEFAULT 'Not specified',
      created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS employers (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(100) NOT NULL,
      phone         VARCHAR(15)  NOT NULL UNIQUE,
      email         VARCHAR(255) UNIQUE,
      city          VARCHAR(100),
      password_hash TEXT,
      is_verified   BOOLEAN DEFAULT FALSE,
      plan          VARCHAR(20) DEFAULT 'free',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS workers (
      id               SERIAL PRIMARY KEY,
      name             VARCHAR(100) NOT NULL,
      phone            VARCHAR(15)  NOT NULL UNIQUE,
      photo_url        TEXT,
      aadhaar_verified BOOLEAN  DEFAULT FALSE,
      skills           TEXT[]   DEFAULT '{}',
      experience_years INTEGER  DEFAULT 0,
      city             VARCHAR(100),
      area             VARCHAR(100),
      availability     VARCHAR(20) DEFAULT 'available',
      expected_salary  INTEGER,
      rating           NUMERIC(2,1) DEFAULT 0.0,
      is_approved      BOOLEAN  DEFAULT FALSE,
      password_hash    TEXT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_workers_city ON workers(city);
    CREATE INDEX IF NOT EXISTS idx_waitlist_phone ON waitlist(phone);
  `;

  try {
    await pool.query(schema);
    console.log('[DB] Schema initialized successfully');
  } catch (err) {
    console.error('[DB] Schema error:', err.message);
    throw err;
  }
}

async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('[DB] Query error:', err.message);
    throw err;
  }
}

module.exports = { pool, query, connectDB };
