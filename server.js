const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Auto-create Waitlist table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS waitlist (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    city VARCHAR(255),
    role VARCHAR(255),
    need VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'MaidConnect Backend is Live' });
});

// Waitlist Submission Route
app.post('/api/waitlist', async (req, res) => {
  try {
    const { name, phone, email, city, role, need } = req.body;
    
    const result = await pool.query(
      `INSERT INTO waitlist (name, phone, email, city, role, need) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, phone, email, city, role, need]
    );
    
    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error saving data' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
