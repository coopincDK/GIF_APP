const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone_number, invite_token } = req.body;
    if (!name || !email || !password || !invite_token)
      return res.status(400).json({ error: 'Navn, email, password og invite-token er påkrævet' });

    const db = getDb();

    const tokenRow = (await db.execute({
      sql: `SELECT * FROM invite_tokens WHERE token = ? AND used_by IS NULL AND (expires_at IS NULL OR expires_at > datetime('now'))`,
      args: [invite_token]
    })).rows[0];
    if (!tokenRow) return res.status(400).json({ error: 'Ugyldigt eller udløbet invite-link' });

    const existing = (await db.execute({ sql: 'SELECT 1 FROM users WHERE email = ?', args: [email] })).rows[0];
    if (existing) return res.status(400).json({ error: 'Email er allerede registreret' });

    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    await db.execute({
      sql: `INSERT INTO users (user_id, name, email, password_hash, role, team_id, phone_number) VALUES (?, ?, ?, ?, 'user', ?, ?)`,
      args: [userId, name, email, passwordHash, tokenRow.team_id, phone_number || null]
    });

    await db.execute({
      sql: `UPDATE invite_tokens SET used_by = ?, used_at = datetime('now') WHERE token = ?`,
      args: [userId, invite_token]
    });

    const token = jwt.sign(
      { user_id: userId, email, role: 'user', team_id: tokenRow.team_id },
      process.env.JWT_SECRET, { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Bruger oprettet! Velkommen til holdet! 🎉',
      token,
      user: { user_id: userId, name, email, role: 'user', team_id: tokenRow.team_id }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email og password er påkrævet' });

    const db = getDb();
    const user = (await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] })).rows[0];

    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Forkert email eller password' });

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role, team_id: user.team_id },
      process.env.JWT_SECRET, { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        user_id: user.user_id, name: user.name, email: user.email,
        role: user.role, team_id: user.team_id,
        profile_picture_url: user.profile_picture_url,
        phone_number: user.phone_number,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const user = (await db.execute({
      sql: 'SELECT user_id, name, email, role, team_id, profile_picture_url, phone_number, created_at FROM users WHERE user_id = ?',
      args: [req.user.user_id]
    })).rows[0];
    if (!user) return res.status(404).json({ error: 'Bruger ikke fundet' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

module.exports = router;
