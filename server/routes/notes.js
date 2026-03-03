const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

// GET /api/notes — hent alle noter for holdet (admin only)
router.get('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const notes = (await db.execute({
      sql: `SELECT n.*, u.name as author_name 
            FROM admin_notes n 
            JOIN users u ON n.author_id = u.user_id
            WHERE n.team_id = ? 
            ORDER BY n.updated_at DESC`,
      args: [req.user.team_id]
    })).rows;
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// POST /api/notes — opret note (admin only)
router.post('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title) return res.status(400).json({ error: 'Titel påkrævet' });
    const db = getDb();
    const id = uuidv4();
    await db.execute({
      sql: `INSERT INTO admin_notes (note_id, team_id, author_id, title, body) VALUES (?, ?, ?, ?, ?)`,
      args: [id, req.user.team_id, req.user.user_id, title, body || '']
    });
    const note = (await db.execute({ sql: 'SELECT * FROM admin_notes WHERE note_id = ?', args: [id] })).rows[0];
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// PUT /api/notes/:id — opdater note (admin only)
router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { title, body } = req.body;
    const db = getDb();
    await db.execute({
      sql: `UPDATE admin_notes SET title = COALESCE(?, title), body = COALESCE(?, body), updated_at = datetime('now') WHERE note_id = ? AND team_id = ?`,
      args: [title || null, body ?? null, req.params.id, req.user.team_id]
    });
    const note = (await db.execute({ sql: 'SELECT * FROM admin_notes WHERE note_id = ?', args: [req.params.id] })).rows[0];
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// DELETE /api/notes/:id — slet note (admin only)
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM admin_notes WHERE note_id = ? AND team_id = ?', args: [req.params.id, req.user.team_id] });
    res.json({ message: 'Note slettet' });
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

module.exports = router;
