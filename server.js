const express = require('express');
const app = express();
app.use(express.json());

// ── 1. ACCOUNT LINK URL ──
// Ring sends users here to log in / create account
app.get('/link', (req, res) => {
  const { redirect_uri, state } = req.query;
  // In production: show your login page here
  // For now: redirect back with a test auth code
  const authCode = 'maidconnect_auth_' + Date.now();
  res.redirect(`${redirect_uri}?code=${authCode}&state=${state}`);
});

// ── 2. APP HOMEPAGE URL ──
// Ring redirects here after linking is complete
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
// Ring sends OAuth code here — exchange for access token
app.post('/oauth/callback', (req, res) => {
  const { code, grant_type } = req.body;
  console.log('Token exchange requested. Code:', code);

  // Return mock tokens (replace with real auth logic later)
  res.json({
    access_token:  'mc_access_'  + Date.now(),
    refresh_token: 'mc_refresh_' + Date.now(),
    token_type:    'Bearer',
    expires_in:    3600
  });
});

// ── 4. WEBHOOK URL ──
// Ring sends doorbell / motion events here
app.post('/webhook', (req, res) => {
  const event = req.body;
  console.log('Ring event received:', JSON.stringify(event, null, 2));

  const eventType = event?.event?.type || 'unknown';

  if (eventType === 'doorbell.ring') {
    console.log('🔔 Maid is at the door! Send push notification.');
  }

  if (eventType === 'motion.detect') {
    console.log('🚶 Motion detected — possible maid arrival.');
  }

  res.status(200).json({ received: true, event: eventType });
});

// ── HEALTH CHECK ──
app.get('/', (req, res) => {
  res.json({
    app:     'MaidConnect Ring Backend',
    status:  'running',
    version: '1.0.0',
    endpoints: {
      link:          '/link',
      config:        '/config',
      tokenExchange: '/oauth/callback',
      webhook:       '/webhook'
    }
  });
});

const PORT = process.env.PORT || 3000;// Privacy Policy
app.get('/privacy', (req, res) => {
  res.send('<h1>MaidConnect Privacy Policy</h1><p>We respect your privacy and protect all user data securely.</p>');
});

// Terms of Service
app.get('/terms', (req, res) => {
  res.send('<h1>MaidConnect Terms of Service</h1><p>By using MaidConnect you agree to our terms.</p>');
});

// Support
app.get('/support', (req, res) => {
  res.send('<h1>MaidConnect Support</h1><p>Email us: support@maidconnect.com</p>');
});// Privacy Policy
app.get('/privacy', (req, res) => {
  res.send('<h1>MaidConnect Privacy Policy</h1><p>We respect your privacy and protect all user data securely.</p>');
});

// Terms of Service
app.get('/terms', (req, res) => {
  res.send('<h1>MaidConnect Terms of Service</h1><p>By using MaidConnect you agree to our terms.</p>');
});

// Support
app.get('/support', (req, res) => {
  res.send('<h1>MaidConnect Support</h1><p>Email: support@maidconnect.com</p>');
});
app.listen(PORT, () => {
  console.log(`MaidConnect Ring Backend running on port ${PORT}`);
});
