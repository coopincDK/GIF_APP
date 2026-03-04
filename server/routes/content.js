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

// GET /api/content/praise  — ros/motivation fra trænerne
router.get('/praise', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const praise = (await db.execute({ sql: "SELECT * FROM content WHERE type = 'praise' ORDER BY sort_order ASC", args: [] })).rows;
    res.json(praise);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// GET /api/content/all — facts + jokes + praise blandet (til DailyFact)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const items = (await db.execute({
      sql: "SELECT c.*, u.name as trainer_name, u.profile_picture_url as trainer_avatar FROM content c LEFT JOIN users u ON c.created_by = u.user_id WHERE c.type IN ('fact','joke','praise') ORDER BY c.sort_order ASC",
      args: []
    })).rows;
    res.json(items);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// GET /api/content?type=regel|fact
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { type } = req.query;
    const items = type
      ? (await db.execute({ sql: 'SELECT * FROM content WHERE type = ? ORDER BY sort_order ASC', args: [type] })).rows
      : (await db.execute({ sql: 'SELECT * FROM content ORDER BY type, sort_order ASC', args: [] })).rows;
    res.json(items);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// POST /api/content  (admin only)
router.post('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { type, title, body_text, image_url, sort_order } = req.body;
    if (!type || !title) return res.status(400).json({ error: 'type og title er påkrævet' });
    const db = getDb();
    const id = uuidv4();
    await db.execute({
      sql: 'INSERT INTO content (content_id, type, title, body_text, image_url, sort_order, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [id, type, title, body_text || null, image_url || null, sort_order || 0, req.user.user_id]
    });
    const item = (await db.execute({ sql: 'SELECT * FROM content WHERE content_id = ?', args: [id] })).rows[0];
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/content/:id  (admin only)
router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { title, body_text, image_url, sort_order } = req.body;
    const db = getDb();
    await db.execute({
      sql: `UPDATE content SET
        title      = COALESCE(?, title),
        body_text  = COALESCE(?, body_text),
        image_url  = COALESCE(?, image_url),
        sort_order = COALESCE(?, sort_order)
        WHERE content_id = ?`,
      args: [title || null, body_text || null, image_url || null, sort_order ?? null, req.params.id]
    });
    const item = (await db.execute({ sql: 'SELECT * FROM content WHERE content_id = ?', args: [req.params.id] })).rows[0];
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/content/:id  (admin only)
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM content WHERE content_id = ?', args: [req.params.id] });
    res.json({ message: 'Indhold slettet' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
