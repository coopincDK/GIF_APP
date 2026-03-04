const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

// GET /api/features — alle flags (alle brugere)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const flags = (await db.execute('SELECT * FROM feature_flags ORDER BY category, flag_key')).rows;
    // Returner som objekt: { spin_wheel: true, badges: false, ... }
    const obj = {};
    for (const f of flags) obj[f.flag_key] = f.enabled === 1;
    res.json(obj);
  } catch (err) {
    // Fallback: alle features ON hvis tabellen ikke eksisterer endnu
    res.json({});
  }
});

// GET /api/features/full — fuld liste med labels (kun admin)
router.get('/full', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const flags = (await db.execute('SELECT * FROM feature_flags ORDER BY category, label')).rows;
    res.json(flags);
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// PUT /api/features/:key — toggle en flag (kun admin)
router.put('/:key', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') return res.status(400).json({ error: 'enabled (boolean) påkrævet' });
    const db = getDb();
    const exists = (await db.execute({ sql: 'SELECT 1 FROM feature_flags WHERE flag_key = ?', args: [req.params.key] })).rows[0];
    if (!exists) return res.status(404).json({ error: 'Flag ikke fundet' });
    await db.execute({
      sql: `UPDATE feature_flags SET enabled = ?, updated_at = datetime('now') WHERE flag_key = ?`,
      args: [enabled ? 1 : 0, req.params.key]
    });
    res.json({ flag_key: req.params.key, enabled, message: `${req.params.key} er nu ${enabled ? 'aktiveret ✅' : 'deaktiveret 🔴'}` });
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// PUT /api/features — opdater ALLE flags på én gang (admin)
router.put('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { flags } = req.body; // { spin_wheel: true, badges: false, ... }
    if (!flags || typeof flags !== 'object') return res.status(400).json({ error: 'flags objekt påkrævet' });
    const db = getDb();
    for (const [key, enabled] of Object.entries(flags)) {
      await db.execute({
        sql: `UPDATE feature_flags SET enabled = ?, updated_at = datetime('now') WHERE flag_key = ?`,
        args: [enabled ? 1 : 0, key]
      });
    }
    res.json({ message: 'Alle flags opdateret ✅', count: Object.keys(flags).length });
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

module.exports = router;
