const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');
const { seed } = require('../db/seed');

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

// GET /api/admin/users — alle brugere på holdet
router.get('/users', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const users = (await db.execute({
      sql: `SELECT user_id as id, name, email, role, profile_picture_url, created_at
            FROM users WHERE team_id = ? ORDER BY name ASC`,
      args: [req.user.team_id]
    })).rows;
    res.json(users);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM users WHERE user_id = ? AND team_id = ?', args: [req.params.id, req.user.team_id] });
    res.json({ message: 'Bruger slettet' });
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// POST /api/admin/invite — generer invite-link
router.post('/invite', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const db = getDb();
    const token = uuidv4();
    const teamId = req.user.team_id;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await db.execute({
      sql: `INSERT INTO invite_tokens (token, team_id, created_by, expires_at) VALUES (?, ?, ?, ?)`,
      args: [token, teamId, req.user.user_id, expiresAt]
    });
    res.json({ token, expiresAt });
  } catch (err) {
    // Fallback: returner bare en token uden at gemme (hvis tabellen ikke eksisterer)
    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4();
    res.json({ token, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() });
  }
});

// GET /api/admin/badges — alle badges
router.get('/badges', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const badges = (await db.execute('SELECT * FROM badges ORDER BY type, name')).rows;
    res.json(badges);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// POST /api/admin/badges/award
router.post('/badges/award', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { userId, badgeId } = req.body;
    if (!userId || !badgeId) return res.status(400).json({ error: 'userId og badgeId påkrævet' });
    const { v4: uuidv4 } = require('uuid');
    const db = getDb();
    const already = (await db.execute({ sql: 'SELECT 1 FROM user_badges WHERE user_id = ? AND badge_id = ?', args: [userId, badgeId] })).rows[0];
    if (already) return res.status(400).json({ error: 'Brugeren har allerede dette badge' });
    await db.execute({ sql: 'INSERT INTO user_badges (user_badge_id, user_id, badge_id) VALUES (?, ?, ?)', args: [uuidv4(), userId, badgeId] });
    res.json({ message: 'Badge tildelt! 🏅' });
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// GET /api/admin/tasks
router.get('/tasks', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const tasks = (await db.execute({
      sql: `SELECT t.*, u.name as assigned_to_name
            FROM tasks t
            LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
            LEFT JOIN users u ON ta.user_id = u.user_id
            ORDER BY t.created_at DESC LIMIT 50`,
      args: []
    })).rows;
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// POST /api/admin/tasks
router.post('/tasks', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { title, description, type } = req.body;
    if (!title) return res.status(400).json({ error: 'Titel påkrævet' });
    const { v4: uuidv4 } = require('uuid');
    const db = getDb();
    const id = uuidv4();
    await db.execute({
      sql: `INSERT INTO tasks (task_id, title, description, type, status) VALUES (?, ?, ?, ?, 'pending')`,
      args: [id, title, description || '', type || 'tøjvask']
    });
    const task = (await db.execute({ sql: 'SELECT * FROM tasks WHERE task_id = ?', args: [id] })).rows[0];
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// DELETE /api/admin/tasks/:id
router.delete('/tasks/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM tasks WHERE task_id = ?', args: [req.params.id] });
    res.json({ message: 'Opgave slettet' });
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// GET /api/admin/cup/shifts
router.get('/cup/shifts', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const shifts = (await db.execute({
      sql: `SELECT cs.*, COUNT(css.signup_id) as signup_count
            FROM cup_shifts cs
            LEFT JOIN cup_shift_signups css ON cs.shift_id = css.shift_id
            WHERE cs.team_id = ?
            GROUP BY cs.shift_id
            ORDER BY cs.shift_date ASC, cs.start_time ASC`,
      args: [req.user.team_id]
    })).rows;
    res.json(shifts.map(s => ({ ...s, id: s.shift_id, date: s.shift_date, startTime: s.start_time, endTime: s.end_time, maxSignups: s.max_signups })));
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// POST /api/admin/cup/shifts
router.post('/cup/shifts', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { title, date, startTime, endTime, icon, maxSignups } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'Titel og dato påkrævet' });
    const { v4: uuidv4 } = require('uuid');
    const db = getDb();
    const id = uuidv4();
    await db.execute({
      sql: `INSERT INTO cup_shifts (shift_id, team_id, title, shift_date, start_time, end_time, icon, max_signups)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, req.user.team_id, title, date, startTime || '', endTime || '', icon || '⚽', maxSignups || 3]
    });
    const shift = (await db.execute({ sql: 'SELECT * FROM cup_shifts WHERE shift_id = ?', args: [id] })).rows[0];
    res.status(201).json({ ...shift, id: shift.shift_id, date: shift.shift_date, startTime: shift.start_time, endTime: shift.end_time });
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// DELETE /api/admin/cup/shifts/:id
router.delete('/cup/shifts/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM cup_shifts WHERE shift_id = ? AND team_id = ?', args: [req.params.id, req.user.team_id] });
    res.json({ message: 'Vagt slettet' });
  } catch (err) { res.status(500).json({ error: 'Serverfejl' }); }
});

// POST /api/admin/reseed — kør seed igen (tilføjer dummy data)
router.post('/reseed', authenticateToken, adminOnly, async (req, res) => {
  try {
    await seed();
    res.json({ success: true, message: '✅ Seed kørt — dummy data tilføjet!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
