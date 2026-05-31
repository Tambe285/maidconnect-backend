const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'MaidConnect Backend is Live! 🚀' });
});

// Test Route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
