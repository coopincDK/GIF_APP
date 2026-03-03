const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

async function getCupStatus(db) {
  const row = (await db.execute({ sql: "SELECT value FROM app_settings WHERE key = 'cup_mode_override'", args: [] })).rows[0];
  const override = row?.value ?? 'auto';
  const cupDate = new Date('2026-07-23');
  const activationDate = new Date(cupDate.getTime() - 28 * 24 * 60 * 60 * 1000);
  const now = new Date();
  let active = false;
  if (override === 'on') active = true;
  else if (override === 'off') active = false;
  else active = now >= activationDate;
  const daysUntilCup = Math.max(0, Math.ceil((cupDate - now) / (1000 * 60 * 60 * 24)));
  return { active, override, daysUntilCup, cupDate: '2026-07-23', activationDate: activationDate.toISOString().split('T')[0] };
}

// GET /api/cup/status — offentlig, kræver ikke login
router.get('/status', async (req, res) => {
  try {
    res.json(await getCupStatus(getDb()));
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// GET /api/cup/shifts
router.get('/shifts', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const shifts = (await db.execute('SELECT * FROM cup_shifts ORDER BY shift_date ASC, start_time ASC')).rows;

    // Hent signups for hvert shift
    const result = await Promise.all(shifts.map(async (shift) => {
      const signups = (await db.execute({
        sql: `SELECT css.signup_id, u.user_id, u.name FROM cup_shift_signups css
              JOIN users u ON css.user_id = u.user_id WHERE css.shift_id = ?`,
        args: [shift.shift_id]
      })).rows;
      return {
        ...shift,
        volunteers: signups,
        signup_count: signups.length,
        is_full: signups.length >= shift.max_volunteers,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// POST /api/cup/shifts  (admin only)
router.post('/shifts', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { title, description, shift_date, start_time, end_time, max_volunteers, icon_type } = req.body;
    if (!title || !shift_date || !start_time || !end_time)
      return res.status(400).json({ error: 'title, shift_date, start_time og end_time er påkrævet' });
    const db = getDb();
    const id = uuidv4();
    await db.execute({
      sql: 'INSERT INTO cup_shifts (shift_id, title, description, shift_date, start_time, end_time, max_volunteers, icon_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id, title, description || null, shift_date, start_time, end_time, max_volunteers || 1, icon_type || 'tent']
    });
    const shift = (await db.execute({ sql: 'SELECT * FROM cup_shifts WHERE shift_id = ?', args: [id] })).rows[0];
    res.status(201).json(shift);
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// DELETE /api/cup/shifts/:id  (admin only)
router.delete('/shifts/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM cup_shift_signups WHERE shift_id = ?', args: [req.params.id] });
    await db.execute({ sql: 'DELETE FROM cup_shifts WHERE shift_id = ?', args: [req.params.id] });
    res.json({ message: 'Vagt slettet' });
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// POST /api/cup/shifts/:id/signup
router.post('/shifts/:id/signup', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const shift = (await db.execute({ sql: 'SELECT * FROM cup_shifts WHERE shift_id = ?', args: [req.params.id] })).rows[0];
    if (!shift) return res.status(404).json({ error: 'Vagt ikke fundet' });

    const signupCount = (await db.execute({ sql: 'SELECT COUNT(*) as c FROM cup_shift_signups WHERE shift_id = ?', args: [req.params.id] })).rows[0].c;
    if (signupCount >= shift.max_volunteers) return res.status(400).json({ error: 'Vagten er fuldt besat' });

    const alreadySigned = (await db.execute({ sql: 'SELECT 1 FROM cup_shift_signups WHERE shift_id = ? AND user_id = ?', args: [req.params.id, req.user.user_id] })).rows[0];
    if (alreadySigned) return res.status(400).json({ error: 'Du er allerede tilmeldt denne vagt' });

    await db.execute({ sql: 'INSERT INTO cup_shift_signups (signup_id, shift_id, user_id) VALUES (?, ?, ?)', args: [uuidv4(), req.params.id, req.user.user_id] });

    // Tildel Cup-Stjerne badge
    const badge = (await db.execute({ sql: "SELECT * FROM badges WHERE type = 'cup' AND name = 'Cup-Stjerne'", args: [] })).rows[0];
    let newBadge = null;
    if (badge) {
      const has = (await db.execute({ sql: 'SELECT 1 FROM user_badges WHERE user_id = ? AND badge_id = ?', args: [req.user.user_id, badge.badge_id] })).rows[0];
      if (!has) {
        await db.execute({ sql: 'INSERT INTO user_badges (user_badge_id, user_id, badge_id) VALUES (?, ?, ?)', args: [uuidv4(), req.user.user_id, badge.badge_id] });
        newBadge = badge;
      }
    }
    res.json({ message: 'Du er tilmeldt vagten! 🌟', new_badge: newBadge });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// DELETE /api/cup/shifts/:id/signup
router.delete('/shifts/:id/signup', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM cup_shift_signups WHERE shift_id = ? AND user_id = ?', args: [req.params.id, req.user.user_id] });
    res.json({ message: 'Du er afmeldt vagten' });
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

module.exports = router;
