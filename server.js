const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// 1. MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// 2. HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'MaidConnect API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 3. API ROUTES (Backend Logic)
app.use('/api/waitlist', require('./src/routes/waitlist'));
app.use('/api/promoters', require('./src/routes/promoters')); // NEW PROMOTER ROUTES
app.use('/api/workers', require('./src/routes/workers'));
app.use('/api/admin', require('./src/routes/admin'));

// 4. FRONTEND ROUTES (Pages)
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

// NEW PROMOTER DASHBOARD PAGE
app.get('/promoter-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'promoter-dashboard.html'));
});

app.get('/leaderboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
});

app.get('/worker-leaderboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'worker-leaderboard.html'));
});

// 5. 404 HANDLER (Route Not Found)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 6. ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 7. START SERVER
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ MaidConnect API running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
