const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'MaidConnect API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/api/waitlist', require('./src/routes/waitlist'));
app.use('/api/promoters', require('./src/routes/promoters'));
app.use('/api/workers', require('./src/routes/workers'));
app.use('/api/admin', require('./src/routes/admin'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});
app.get('/manifesto', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'magazine.html'));
});
app.get('/worker-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'worker-dashboard.html'));
});
app.get('/promoter-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'promoter-dashboard.html'));
});
app.get('/business-plans', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'business-plans.html'));
});
app.get('/business-signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'business-signup.html'));
});
app.get('/leaderboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
});
app.get('/worker-leaderboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'worker-leaderboard.html'));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ MaidConnect API running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  connectDB()
    .then(() => {
      console.log('🚀 Database connected — ready to serve requests');
    })
    .catch((err) => {
      console.error('❌ Database connection failed:', err.message);
      process.exit(1);
    });
});

module.exports = app;
