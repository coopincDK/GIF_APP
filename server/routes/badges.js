const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

// GET /api/badges/my/timeline — brugerens fulde badge-historik med uger
router.get('/my/timeline', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.user_id;

    // Badges (user_badges)
    const badges = (await db.execute({
      sql: `SELECT ub.user_badge_id, ub.date_awarded,
                   b.badge_id, b.name, b.description, b.image_url, b.type
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.badge_id
            WHERE ub.user_id = ?
            ORDER BY ub.date_awarded DESC`,
      args: [userId]
    })).rows;

    // Weekly awards (ugens helte)
    const awards = (await db.execute({
      sql: `SELECT wa.award_id, wa.category, wa.week_number, wa.year, wa.note, wa.created_at,
                   ab.name as awarded_by_name
            FROM weekly_awards wa
            LEFT JOIN users ab ON wa.awarded_by = ab.user_id
            WHERE wa.user_id = ?
            ORDER BY wa.year DESC, wa.week_number DESC`,
      args: [userId]
    })).rows;

    // Frivillig-historik (bekræftede)
    const volunteer = (await db.execute({
      sql: `SELECT signup_id, volunteer_type, match_date, confirmed_at
            FROM volunteer_signups
            WHERE user_id = ? AND confirmed = 1
            ORDER BY match_date DESC`,
      args: [userId]
    })).rows;

    // Samlet score: 1 pt per badge + 1 pt per award + 1 pt per frivillig
    const totalScore = badges.length + awards.length + volunteer.length;

    res.json({ badges, awards, volunteer, totalScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/badges/my — egne badges (bruger fra JWT)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const badges = (await db.execute({
      sql: `SELECT ub.user_badge_id, ub.date_awarded, b.*
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.badge_id
            WHERE ub.user_id = ? ORDER BY ub.date_awarded DESC`,
      args: [req.user.user_id]
    })).rows;
    res.json(badges);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// GET /api/badges/team — alle badges for holdet (ingen teamId param)
router.get('/team', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const badges = (await db.execute({
      sql: `SELECT ub.user_badge_id, ub.date_awarded, b.badge_id, b.name, b.description, b.image_url, b.type,
                   u.user_id, u.name as user_name, u.profile_picture_url
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.badge_id
            JOIN users u ON ub.user_id = u.user_id
            WHERE u.team_id = ? ORDER BY ub.date_awarded DESC`,
      args: [req.user.team_id]
    })).rows;
    res.json(badges);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

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
