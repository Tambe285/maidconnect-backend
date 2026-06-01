require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const { connectDB } = require('./src/db');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/', (_req, res) => {
  res.json({
    service: 'MaidConnect API',
    version: '1.0.0',
    status:  'running',
    env:     process.env.NODE_ENV || 'development',
  });
});

app.get('/health', async (_req, res) => {
  try {
    const { query } = require('./src/db');
    const result = await query('SELECT 1 as ok');
    res.json({
      status:    'healthy',
      database:  result.rows[0].ok === 1 ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
      uptime:    Math.floor(process.uptime()),
    });
  } catch (err) {
    res.status(503).json({
      status:   'unhealthy',
      database: 'disconnected',
      error:    err.message,
    });
  }
});

app.use('/api/waitlist', require('./src/routes/waitlist'));

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

app.use((err, _req, res, _next) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

async function start() {
  try {
    console.log('[Server] Connecting to database...');
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] MaidConnect API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Startup failed:', err.message);
    process.exit(1);
  }
}

start();
