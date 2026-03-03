const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

// GET /api/admin/settings
router.get('/settings', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const rows = (await db.execute('SELECT * FROM app_settings')).rows;
    const obj = {};
    for (const s of rows) obj[s.key] = s.value;
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// PUT /api/admin/settings/cup-mode
router.put('/settings/cup-mode', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { override } = req.body;
    if (!['on', 'off', 'auto'].includes(override))
      return res.status(400).json({ error: 'override skal være "on", "off" eller "auto"' });

    const db = getDb();
    await db.execute({
      sql: `INSERT INTO app_settings (key, value, updated_at) VALUES ('cup_mode_override', ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      args: [override]
    });

    const labels = { on: 'aktiveret manuelt 🏆', off: 'deaktiveret 🔴', auto: 'sat til automatisk 🟡' };
    res.json({ success: true, override, message: `Cup-Mode er nu ${labels[override]}` });
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// GET /api/admin/stats
router.get('/stats', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const teamId = req.user.team_id;
    const userCount    = (await db.execute({ sql: 'SELECT COUNT(*) as c FROM users WHERE team_id = ? AND role = "user"', args: [teamId] })).rows[0].c;
    const taskCount    = (await db.execute({ sql: 'SELECT COUNT(*) as c FROM tasks WHERE team_id = ?', args: [teamId] })).rows[0].c;
    const completedCount = (await db.execute({ sql: `SELECT COUNT(*) as c FROM task_assignments ta JOIN tasks t ON ta.task_id = t.task_id WHERE t.team_id = ? AND ta.completion_date IS NOT NULL`, args: [teamId] })).rows[0].c;
    const badgeCount   = (await db.execute({ sql: `SELECT COUNT(*) as c FROM user_badges ub JOIN users u ON ub.user_id = u.user_id WHERE u.team_id = ?`, args: [teamId] })).rows[0].c;
    res.json({ userCount, taskCount, completedCount, badgeCount });
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

module.exports = router;
