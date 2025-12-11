const express = require('express');
const cors = require('cors');
const LinkChecker = require('./linkChecker');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Main link checker endpoint
app.post('/api/check-links', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Validate URL format
    new URL(url);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    const checker = new LinkChecker(url);
    const results = await checker.check();
    res.json(results);
  } catch (error) {
    console.error('Error checking links:', error);
    res.status(500).json({
      error: 'Failed to check links',
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Link checker server running on http://localhost:${PORT}`);
});
