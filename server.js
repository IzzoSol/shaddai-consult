// SHADDAI CONSULT: static site + sign-up and contact endpoints.
// Runs on Render with: build "yarn", start "node server.js".
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Tiny per-IP rate limit so the forms can't be spammed.
const hits = new Map();
function limited(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < 60_000);
  if (recent.length >= 5) return res.status(429).json({ ok: false, error: 'Too many requests. Try again in a minute.' });
  recent.push(now);
  hits.set(key, recent);
  next();
}

function clean(v, max) {
  return String(v || '').trim().slice(0, max);
}

function save(file, record) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.appendFileSync(path.join(DATA_DIR, file), JSON.stringify(record) + '\n');
}

app.post('/api/signup', limited, (req, res) => {
  const email = clean(req.body.email, 200).toLowerCase();
  const name = clean(req.body.name, 120);
  const interest = clean(req.body.interest, 60);
  if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: 'Enter a valid email address.' });
  save('signups.jsonl', { email, name, interest, at: new Date().toISOString() });
  res.json({ ok: true });
});

app.post('/api/contact', limited, (req, res) => {
  const name = clean(req.body.name, 120);
  const email = clean(req.body.email, 200).toLowerCase();
  const message = clean(req.body.message, 4000);
  if (!name || !EMAIL_RE.test(email) || !message) {
    return res.status(400).json({ ok: false, error: 'Name, a valid email and a message are required.' });
  }
  save('contacts.jsonl', { name, email, message, at: new Date().toISOString() });
  res.json({ ok: true });
});

app.get('/healthz', (req, res) => res.json({ ok: true }));

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', '404.html')));

app.listen(PORT, () => console.log(`SHADDAI CONSULT listening on ${PORT}`));
