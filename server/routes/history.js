const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

// GET /api/history — komplet historik for holdet (admin only)
// Returnerer: tøjvask-vindere, ugens helte awards, frivillige bekræftede
router.get('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();

    // Tøjvask-historik (filtreret via users.team_id)
    const laundry = (await db.execute({
      sql: `SELECT u.name, ta.assigned_at as date, 'tøjvask' as type, t.title as detail
            FROM task_assignments ta
            JOIN users u ON ta.user_id = u.user_id
            JOIN tasks t ON ta.task_id = t.task_id
            WHERE u.team_id = ? AND (t.title LIKE '%øjvask%' OR t.type = 'tøjvask')
            ORDER BY ta.assigned_at DESC
            LIMIT 100`,
      args: [req.user.team_id]
    })).rows;

    // Awards historik (ugens helte) — filtreret via users.team_id (weekly_awards har ingen team_id)
    const awards = (await db.execute({
      sql: `SELECT a.*, u.name as winner_name, creator.name as given_by_name
            FROM weekly_awards a
            LEFT JOIN users u ON a.user_id = u.user_id
            LEFT JOIN users creator ON a.awarded_by = creator.user_id
            WHERE u.team_id = ?
            ORDER BY a.year DESC, a.week_number DESC, a.category ASC
            LIMIT 200`,
      args: [req.user.team_id]
    })).rows;

    // Frivillige historik (bekræftede) — filtreret via users.team_id
    const volunteers = (await db.execute({
      sql: `SELECT vs.*, u.name as user_name
            FROM volunteer_signups vs
            JOIN users u ON vs.user_id = u.user_id
            WHERE vs.confirmed = 1 AND u.team_id = ?
            ORDER BY vs.match_date DESC, vs.volunteer_type ASC
            LIMIT 100`,
      args: [req.user.team_id]
    })).rows;

    res.json({ laundry, awards, volunteers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

module.exports = router;
