const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

// POST /api/invite/generate  (admin only)
router.post('/generate', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await db.execute({
      sql: 'INSERT INTO invite_tokens (token, team_id, created_by, expires_at) VALUES (?, ?, ?, ?)',
      args: [token, req.user.team_id, req.user.user_id, expiresAt]
    });

    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.json({
      token,
      invite_url: `${baseUrl}/register?token=${token}`,
      expires_at: expiresAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// GET /api/invite/validate/:token
router.get('/validate/:token', async (req, res) => {
  try {
    const db = getDb();
    const invite = (await db.execute({
      sql: `SELECT it.*, t.team_name FROM invite_tokens it
            JOIN teams t ON it.team_id = t.team_id
            WHERE it.token = ? AND it.used_by IS NULL AND (it.expires_at IS NULL OR it.expires_at > datetime('now'))`,
      args: [req.params.token]
    })).rows[0];

    if (!invite) return res.status(400).json({ valid: false, error: 'Ugyldigt eller udløbet invite-link' });
    res.json({ valid: true, team_name: invite.team_name, team_id: invite.team_id });
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// GET /api/invite/list  (admin only)
router.get('/list', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const invites = (await db.execute({
      sql: `SELECT it.*, u.name as used_by_name FROM invite_tokens it
            LEFT JOIN users u ON it.used_by = u.user_id
            WHERE it.team_id = ? ORDER BY it.created_at DESC LIMIT 20`,
      args: [req.user.team_id]
    })).rows;
    res.json(invites);
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

module.exports = router;
