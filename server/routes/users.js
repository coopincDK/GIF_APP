const express = require('express');
const path = require('path');
const multer = require('multer');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.params.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/users
router.get('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const users = (await db.execute({
      sql: 'SELECT user_id, name, email, role, team_id, profile_picture_url, phone_number, created_at FROM users WHERE team_id = ? ORDER BY created_at ASC',
      args: [req.user.team_id]
    })).rows;
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// GET /api/users/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const user = (await db.execute({
      sql: 'SELECT user_id, name, email, role, team_id, profile_picture_url, phone_number, created_at FROM users WHERE user_id = ?',
      args: [req.params.id]
    })).rows[0];
    if (!user) return res.status(404).json({ error: 'Bruger ikke fundet' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// PUT /api/users/:id
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.user_id !== req.params.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Ingen adgang' });
  try {
    const { name, phone_number } = req.body;
    const db = getDb();
    await db.execute({
      sql: 'UPDATE users SET name = COALESCE(?, name), phone_number = COALESCE(?, phone_number) WHERE user_id = ?',
      args: [name || null, phone_number || null, req.params.id]
    });
    const updated = (await db.execute({
      sql: 'SELECT user_id, name, email, role, team_id, profile_picture_url, phone_number FROM users WHERE user_id = ?',
      args: [req.params.id]
    })).rows[0];
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// POST /api/users/:id/avatar
router.post('/:id/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  if (req.user.user_id !== req.params.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Ingen adgang' });
  if (!req.file) return res.status(400).json({ error: 'Ingen fil uploadet' });
  try {
    const url = `/uploads/${req.file.filename}`;
    const db = getDb();
    await db.execute({ sql: 'UPDATE users SET profile_picture_url = ? WHERE user_id = ?', args: [url, req.params.id] });
    res.json({ profile_picture_url: url });
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// DELETE /api/users/:id  (admin only)
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  if (req.params.id === req.user.user_id)
    return res.status(400).json({ error: 'Du kan ikke slette dig selv' });
  try {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM user_badges WHERE user_id = ?', args: [req.params.id] });
    await db.execute({ sql: 'DELETE FROM task_assignments WHERE user_id = ?', args: [req.params.id] });
    await db.execute({ sql: 'DELETE FROM cup_shift_signups WHERE user_id = ?', args: [req.params.id] });
    await db.execute({ sql: 'DELETE FROM users WHERE user_id = ?', args: [req.params.id] });
    res.json({ message: 'Bruger slettet' });
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

module.exports = router;
