const express = require('express');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from project root (so index.html is available)
app.use(express.static(path.join(__dirname, '..')));

// Simple proxy endpoint to Postcodify to avoid CORS issues
app.get('/api/postcodify', async (req, res) => {
  try {
    const q = req.query.q || req.query.query;
    if (!q) return res.status(400).json({ error: 'query required' });

    const url = `https://api.poesis.dev/post/search?query=${encodeURIComponent(q)}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ error: 'upstream_error', status: r.status });

    const json = await r.json();

    // Cache for a short time
    res.set('Cache-Control', 'public, max-age=60');
    res.json(json);
  } catch (err) {
    console.error('proxy error', err);
    res.status(500).json({ error: 'proxy_failed', message: err.message });
  }
});

app.listen(PORT, () => console.log(`Postcodify proxy + static server listening on http://localhost:${PORT}`));
