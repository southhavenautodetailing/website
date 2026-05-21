// Beach Reset Detailing Co. — dev server
// Zero dependencies: uses only Node.js built-in modules.
// Run with: node server.js

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT         = process.env.PORT || 3000;
const REVIEWS_FILE = path.join(__dirname, 'reviews.json');
const PUBLIC_DIR   = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

// Ensure reviews file exists
if (!fs.existsSync(REVIEWS_FILE)) {
  fs.writeFileSync(REVIEWS_FILE, '[]', 'utf8');
}

function readReviews() {
  return JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf8'));
}

function writeReviews(reviews) {
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf8');
}

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  // Strip query strings
  const url = req.url.split('?')[0];

  // ── GET /api/reviews ──────────────────────────────────────────
  if (url === '/api/reviews' && req.method === 'GET') {
    return sendJSON(res, 200, readReviews());
  }

  // ── POST /api/reviews ─────────────────────────────────────────
  if (url === '/api/reviews' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let review;
      try { review = JSON.parse(body); }
      catch { return sendJSON(res, 400, { error: 'Invalid JSON' }); }

      const { name, message, rating } = review;

      if (!name || typeof name !== 'string' || !name.trim())
        return sendJSON(res, 400, { error: 'Name is required' });
      if (!message || typeof message !== 'string' || !message.trim())
        return sendJSON(res, 400, { error: 'Message is required' });
      if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5)
        return sendJSON(res, 400, { error: 'Rating must be 1–5' });

      const newReview = {
        name:      name.trim(),
        message:   message.trim(),
        rating:    Math.round(rating),
        timestamp: new Date().toISOString(),
      };

      const reviews = readReviews();
      reviews.push(newReview);
      writeReviews(reviews);

      return sendJSON(res, 201, { success: true, review: newReview });
    });
    return;
  }

  // ── Static files ──────────────────────────────────────────────
  const filePath = path.join(PUBLIC_DIR, url === '/' ? 'index.html' : url);

  // Prevent directory traversal outside PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  Beach Reset Detailing Co.`);
  console.log(`  → http://localhost:${PORT}\n`);
});
