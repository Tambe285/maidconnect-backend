const express = require('express');
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const serviceAccount = require('/etc/secrets/serviceAccount.json');

const app = express();
app.use(express.json());

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Database schemas
const EventLog = mongoose.model('EventLog', new mongoose.Schema({
  eventType: String,
  receivedAt: { type: Date, default: Date.now },
  raw: Object
}));

const User = mongoose.model('User', new mongoose.Schema({
  accessToken: String,
  refreshToken: String,
  linkedAt: { type: Date, default: Date.now }
}));

// ── 1. ACCOUNT LINK URL ──
app.get('/link', (req, res) => {
  const { redirect_uri, state } = req.query;
  if (!redirect_uri || !state) {
    return res.status(400).send('Missing redirect_uri or state');
  }
  const authCode = 'maidconnect_auth_' + Date.now();
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', authCode);
  redirectUrl.searchParams.set('state', state);
  res.redirect(redirectUrl.toString());
});

// ── 2. APP HOMEPAGE URL ──
app.get('/config', (req, res) => {
  res.send(`
    <html>
      <head><title>MaidConnect — Connected!</title></head>
      <body style="font-family:Arial;text-align:center;padding:60px;background:#0f0c29;color:white;">
        <h1 style="color:#f5c518;">✅ MaidConnect</h1>
        <p style="color:#4ecdc4;font-size:1.2rem;">Your account is successfully linked!</p>
        <p style="color:#aaa;">You can now receive maid arrival notifications via Ring.</p>
      </body>
    </html>
  `);
});

// ── 3. TOKEN EXCHANGE URL ──
app.post('/oauth/callback', async (req, res) => {
  const { code, grant_type } = req.body;
  console.log('Token exchange requested. Code:', code);

  const accessToken = 'mc_access_' + Date.now();
  const refreshToken = 'mc_refresh_' + Date.now();

  // Save user to database
  await User.create({ accessToken, refreshToken });

  res.json({
    access_token:  accessToken,
    refresh_token: refreshToken,
    token_type:    'Bearer',
    expires_in:    3600
  });
});

// ── 4. WEBHOOK URL ──
app.post('/webhook', async (req, res) => {
  const event = req.body;
  console.log('Ring event received:', JSON.stringify(event, null, 2));

  const eventType = event?.event?.type || 'unknown';

  // Save event to database
  await EventLog.create({ eventType, raw: event });

  if (eventType === 'doorbell.ring') {
    console.log('🔔 Maid is at the door!');
    try {
      await admin.messaging().send({
        notification: {
          title: '🔔 Maid Arrived!',
          body: 'Your maid is at the door'
        },
        topic: 'maid-alerts'
      });
    } catch (err) {
      console.error('Notification error:', err);
    }
  }

  if (eventType === 'motion.detect') {
    console.log('🚶 Motion detected!');
    try {
      await admin.messaging().send({
        notification: {
          title: '🚶 Motion Detected',
          body: 'Someone may be arriving at your door'
        },
        topic: 'maid-alerts'
      });
    } catch (err) {
      console.error('Notification error:', err);
    }
  }

  res.status(200).json({ received: true, event: eventType });
});

// ── HEALTH CHECK ──
app.get('/', (req, res) => {
  res.json({
    app: 'MaidConnect Ring Backend',
    status: 'running',
    version: '1.0.0',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ── STATIC PAGES ──
app.get('/privacy', (req, res) => {
  res.send('<h1>MaidConnect Privacy Policy</h1><p>We respect your privacy.</p>');
});
app.get('/terms', (req, res) => {
  res.send('<h1>MaidConnect Terms of Service</h1><p>By using MaidConnect you agree to our terms.</p>');
});
app.get('/support', (req, res) => {
  res.send('<h1>MaidConnect Support</h1><p>Email: support@maidconnect.com</p>');
});

// ── START SERVER ──
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MaidConnect Ring Backend running on port ${PORT}`);
});
