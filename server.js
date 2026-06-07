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

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'admin')));

// Import routes
const adminRoutes = require('./src/routes/admin');
const paymentRoutes = require('./src/routes/payment');
const workerRoutes = require('./src/routes/workers');
const customerRoutes = require('./src/routes/customers');

// Use routes
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/customers', customerRoutes);

// ==========================================
// ROOT ROUTE - MUST BE BEFORE 404 HANDLER
// ==========================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'MaidConnect API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ==========================================
// PUBLIC PAGES
// ==========================================
// Worker pages
app.get('/worker-signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'worker-signup.html'));
});

app.get('/worker-signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'worker-signup.html'));
});

// Customer pages
app.get('/customer-signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'customer-signup.html'));
});

app.get('/customer-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'customer-login.html'));
});

app.get('/browse-workers', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'browse-workers.html'));
});

app.get('/my-bookings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'my-bookings.html'));
});

// Promoter pages
app.get('/promoter-signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'promoter-signup.html'));
});

app.get('/promoter-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'promoter-dashboard.html'));
});

// Business pages
app.get('/business-plans', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'business-plans.html'));
});

// Payment success page
app.get('/payment/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment-success.html'));
});

// ==========================================
// ADMIN PAGES
// ==========================================
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

app.get('/admin/applications', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'applications.html'));
});

app.get('/admin/workers', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'workers.html'));
});

app.get('/admin/workers.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'workers.html'));
});

// ==========================================
// 404 HANDLER - MUST BE AFTER ALL ROUTES
// ==========================================
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     MaidConnect API Server Running!        ║');
  console.log('║                                            ║');
  console.log(`║     Port: ${PORT}                            ║`);
  console.log(`║     Environment: ${process.env.NODE_ENV || 'development'}               ║`);
  console.log(`║     Health: http://localhost:${PORT}/health ║`);
  console.log('╚════════════════════════════════════════════╝');
  console.log('\n');
});

module.exports = app;
