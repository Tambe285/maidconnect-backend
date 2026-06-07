const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public and admin folders
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'admin')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Import routes
const adminRoutes = require('./src/routes/admin');
const paymentRoutes = require('./src/routes/payment');
const workerRoutes = require('./src/routes/workers');
const promoterRoutes = require('./src/routes/promoter');

// Use routes
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/promoter', promoterRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'MaidConnect API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Payment success page
app.get('/payment/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment-success.html'));
});

// Worker signup page
app.get('/worker-signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'worker-signup.html'));
});
// Promoter pages
app.get('/promoter-signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'promoter-signup.html'));
});

app.get('/promoter-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'promoter-dashboard.html'));
});

// Serve admin pages
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

app.get('/admin/applications', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'applications.html'));
});

app.get('/admin/workers', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'workers.html'));
});

// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Business plans page
app.get('/business-plans', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'business-plans.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`    ╔════════════════════════════════════════════╗
    ║                                            ║
    ║     MaidConnect API Server Running!        ║
    ║                                            ║
         Port: ${PORT}                           ║
    ║     Environment: ${process.env.NODE_ENV || 'development'}              ║
                                                ║
    ║     Health: http://localhost:${PORT}/health ║
                                                ║
    ╚════════════════════════════════════════════╝
  `);
});

module.exports = app;
