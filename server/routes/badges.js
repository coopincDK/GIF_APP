const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

// GET /api/badges
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const badges = (await db.execute('SELECT * FROM badges ORDER BY type, name')).rows;
    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// GET /api/badges/team/:teamId
router.get('/team/:teamId', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const badges = (await db.execute({
      sql: `SELECT ub.user_badge_id, ub.date_awarded, b.badge_id, b.name, b.description, b.image_url, b.type,
                   u.user_id, u.name as user_name, u.profile_picture_url
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.badge_id
            JOIN users u ON ub.user_id = u.user_id
            WHERE u.team_id = ? ORDER BY ub.date_awarded DESC`,
      args: [req.params.teamId]
    })).rows;
    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// GET /api/badges/user/:userId
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const badges = (await db.execute({
      sql: `SELECT ub.user_badge_id, ub.date_awarded, b.*
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.badge_id
            WHERE ub.user_id = ? ORDER BY ub.date_awarded DESC`,
      args: [req.params.userId]
    })).rows;
    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// POST /api/badges/award  (admin only)
router.post('/award', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { user_id, badge_id } = req.body;
    if (!user_id || !badge_id) return res.status(400).json({ error: 'user_id og badge_id er påkrævet' });
    const db = getDb();
    const alreadyHas = (await db.execute({ sql: 'SELECT 1 FROM user_badges WHERE user_id = ? AND badge_id = ?', args: [user_id, badge_id] })).rows[0];
    if (alreadyHas) return res.status(400).json({ error: 'Brugeren har allerede dette badge' });
    await db.execute({ sql: 'INSERT INTO user_badges (user_badge_id, user_id, badge_id) VALUES (?, ?, ?)', args: [uuidv4(), user_id, badge_id] });
    const badge = (await db.execute({ sql: 'SELECT * FROM badges WHERE badge_id = ?', args: [badge_id] })).rows[0];
    res.json({ message: `Badge "${badge.name}" tildelt! 🏅`, badge });
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

module.exports = router;
