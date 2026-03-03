const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

// GET /api/content/jokes
router.get('/jokes', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const jokes = (await db.execute({ sql: "SELECT * FROM content WHERE type = 'joke' ORDER BY sort_order ASC", args: [] })).rows;
    res.json(jokes);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// GET /api/content/facts
router.get('/facts', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const facts = (await db.execute({ sql: "SELECT * FROM content WHERE type = 'fact' ORDER BY sort_order ASC", args: [] })).rows;
    res.json(facts);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// GET /api/content/rules
router.get('/rules', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const rules = (await db.execute({ sql: "SELECT * FROM content WHERE type = 'regel' ORDER BY sort_order ASC", args: [] })).rows;
    res.json(rules);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// GET /api/content?type=regel|fact
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { type } = req.query;
  const content = type
    ? db.prepare('SELECT * FROM content WHERE type = ? ORDER BY sort_order ASC').all(type)
    : db.prepare('SELECT * FROM content ORDER BY type, sort_order ASC').all();
  res.json(content);
});

// POST /api/content  (admin only)
router.post('/', authenticateToken, adminOnly, (req, res) => {
  const { type, title, body_text, image_url, sort_order } = req.body;
  if (!type || !title) return res.status(400).json({ error: 'type og title er påkrævet' });
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO content (content_id, type, title, body_text, image_url, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, type, title, body_text || null, image_url || null, sort_order || 0);
  const item = db.prepare('SELECT * FROM content WHERE content_id = ?').get(id);
  res.status(201).json(item);
});

// PUT /api/content/:id  (admin only)
router.put('/:id', authenticateToken, adminOnly, (req, res) => {
  const { title, body_text, image_url, sort_order } = req.body;
  const db = getDb();
  db.prepare(`
    UPDATE content SET
      title = COALESCE(?, title),
      body_text = COALESCE(?, body_text),
      image_url = COALESCE(?, image_url),
      sort_order = COALESCE(?, sort_order)
    WHERE content_id = ?
  `).run(title || null, body_text || null, image_url || null, sort_order ?? null, req.params.id);
  const item = db.prepare('SELECT * FROM content WHERE content_id = ?').get(req.params.id);
  res.json(item);
});

// DELETE /api/content/:id  (admin only)
router.delete('/:id', authenticateToken, adminOnly, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM content WHERE content_id = ?').run(req.params.id);
  res.json({ message: 'Indhold slettet' });
});

module.exports = router;
