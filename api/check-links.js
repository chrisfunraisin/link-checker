const LinkChecker = require('../backend/linkChecker');

module.exports = async (req, res) => {
  // Basic CORS handling for cross-origin requests from frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const checker = new LinkChecker(url);
    // Allow overriding via env var for serverless usage
    if (process.env.MAX_PAGES) checker.maxPages = parseInt(process.env.MAX_PAGES, 10) || checker.maxPages;
    const results = await checker.check();
    return res.status(200).json(results);
  } catch (err) {
    console.error('Serverless check-links error:', err);
    return res.status(500).json({ error: 'Failed to check links', message: err.message });
  }
};
