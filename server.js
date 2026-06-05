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
