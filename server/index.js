require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db/database');
const { seed } = require('./db/seed');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/users',   require('./routes/users'));
app.use('/api/invite',  require('./routes/invite'));
app.use('/api/tasks',   require('./routes/tasks'));
app.use('/api/badges',  require('./routes/badges'));
app.use('/api/content', require('./routes/content'));
app.use('/api/cup',     require('./routes/cup'));
app.use('/api/admin',   require('./routes/admin'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'GIF Hold-Helte Backend 🏆', timestamp: new Date().toISOString() });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Endpoint ikke fundet: ${req.method} ${req.path}` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server fejl:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Filen er for stor (maks 5 MB)' });
  res.status(500).json({ error: 'Intern serverfejl', details: err.message });
});

// ── Start: init DB → seed → listen ───────────────────────────────────────────
async function start() {
  try {
    await initDb();
    await seed();
    app.listen(PORT, () => {
      console.log(`\n🚀 GIF Hold-Helte backend kører på port ${PORT}`);
      console.log(`   → API:    http://localhost:${PORT}/api`);
      console.log(`   → Health: http://localhost:${PORT}/api/health`);
      console.log(`   → CORS:   ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
    });
  } catch (err) {
    console.error('❌ Kunne ikke starte server:', err);
    process.exit(1);
  }
}

start();
module.exports = app;
