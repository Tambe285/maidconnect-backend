const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'admin')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

const adminRoutes = require('./src/routes/admin');
const paymentRoutes = require('./src/routes/payment');
const workerRoutes = require('./src/routes/workers');

app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/workers', workerRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'MaidConnect API is running', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/payment/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment-success.html'));
});
app.get('/worker-signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'worker-signup.html'));
});
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
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/business-plans', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'business-plans.html'));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ MaidConnect API running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
