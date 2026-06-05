// 1. REQUIRE STATEMENTS FIRST
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 2. INITIALIZE EXPRESS
const app = express();
const PORT = process.env.PORT || 10000;

// 3. MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. SERVE STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// 5. HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'MaidConnect API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 6. API ROUTES
app.use('/api/waitlist', require('./src/routes/waitlist'));
app.use('/api/promoters', require('./src/routes/promoters'));
app.use('/api/workers', require('./src/routes/workers'));
app.use('/api/admin', require('./src/routes/admin'));

// 7. FRONTEND ROUTES
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

// Worker Dashboard Page
app.get('/worker-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'worker-dashboard.html'));
});

app.get('/leaderboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
});

app.get('/worker-leaderboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'worker-leaderboard.html'));
});

// 8. 404 HANDLER
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 9. ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 10. START SERVER
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ MaidConnect API running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
