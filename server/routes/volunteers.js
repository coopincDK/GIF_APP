const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

const VALID_TYPES = ['frugt', 'kage', 'koersel', 'fotos'];
const VOLUNTEER_BADGE_NAME = 'Frivillig-Helt';

// Hjælpefunktion: tildel Frivillig-Helt badge hvis ikke allerede tildelt
async function awardVolunteerBadge(db, userId) {
  const badge = (await db.execute({
    sql: 'SELECT * FROM badges WHERE name = ?',
    args: [VOLUNTEER_BADGE_NAME],
  })).rows[0];
  if (!badge) return null;

  const has = (await db.execute({
    sql: 'SELECT 1 FROM user_badges WHERE user_id = ? AND badge_id = ?',
    args: [userId, badge.badge_id],
  })).rows[0];

  if (!has) {
    await db.execute({
      sql: 'INSERT INTO user_badges (user_badge_id, user_id, badge_id) VALUES (?, ?, ?)',
      args: [uuidv4(), userId, badge.badge_id],
    });
    return badge;
  }
  return null;
}

// GET /api/volunteers?matchDate=YYYY-MM-DD  — hent frivillige for en dato
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { matchDate } = req.query;
    if (!matchDate) return res.status(400).json({ error: 'matchDate er påkrævet (YYYY-MM-DD)' });

    const db = getDb();
    const signups = (await db.execute({
      sql: `SELECT vs.signup_id, vs.volunteer_type, vs.match_date, vs.confirmed, vs.confirmed_at,
                   u.user_id, u.name as user_name, u.profile_picture_url,
                   cb.name as confirmed_by_name
            FROM volunteer_signups vs
            JOIN users u ON vs.user_id = u.user_id
            LEFT JOIN users cb ON vs.confirmed_by = cb.user_id
            WHERE vs.match_date = ?
            ORDER BY vs.volunteer_type, vs.created_at`,
      args: [matchDate],
    })).rows;

    // Gruppér pr. type for frontend convenience
    const grouped = VALID_TYPES.reduce((acc, type) => {
      acc[type] = signups.filter(s => s.volunteer_type === type);
      return acc;
    }, {});

    res.json({ match_date: matchDate, signups, grouped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// POST /api/volunteers  — bruger tilmelder sig
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { volunteerType, matchDate } = req.body;
    if (!volunteerType || !matchDate)
      return res.status(400).json({ error: 'volunteerType og matchDate er påkrævet' });
    if (!VALID_TYPES.includes(volunteerType))
      return res.status(400).json({ error: `Ugyldig type. Gyldige: ${VALID_TYPES.join(', ')}` });

    const db = getDb();
    const signupId = uuidv4();

    try {
      await db.execute({
        sql: `INSERT INTO volunteer_signups (signup_id, user_id, volunteer_type, match_date)
              VALUES (?, ?, ?, ?)`,
        args: [signupId, req.user.user_id, volunteerType, matchDate],
      });
    } catch (dbErr) {
      if (dbErr.message && dbErr.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Du er allerede tilmeldt denne opgave til den dato' });
      }
      throw dbErr;
    }

    const signup = (await db.execute({
      sql: `SELECT vs.*, u.name as user_name FROM volunteer_signups vs
            JOIN users u ON vs.user_id = u.user_id
            WHERE vs.signup_id = ?`,
      args: [signupId],
    })).rows[0];

    res.status(201).json({ message: `✅ Tilmeldt som frivillig (${volunteerType}) til ${matchDate}!`, signup });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// DELETE /api/volunteers/:signupId  — bruger afmelder sig selv
router.delete('/:signupId', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const signup = (await db.execute({
      sql: 'SELECT * FROM volunteer_signups WHERE signup_id = ?',
      args: [req.params.signupId],
    })).rows[0];

    if (!signup) return res.status(404).json({ error: 'Tilmelding ikke fundet' });

    // Kun admin eller ejeren selv må afmelde
    const isAdmin = req.user.role === 'admin';
    const isOwner = signup.user_id === req.user.user_id;
    if (!isAdmin && !isOwner)
      return res.status(403).json({ error: 'Du kan kun afmelde dig selv' });

    await db.execute({ sql: 'DELETE FROM volunteer_signups WHERE signup_id = ?', args: [req.params.signupId] });
    res.json({ message: 'Afmeldt som frivillig' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// PUT /api/volunteers/:signupId/confirm  — admin bekræfter + giver badge
router.put('/:signupId/confirm', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const signup = (await db.execute({
      sql: 'SELECT * FROM volunteer_signups WHERE signup_id = ?',
      args: [req.params.signupId],
    })).rows[0];

    if (!signup) return res.status(404).json({ error: 'Tilmelding ikke fundet' });
    if (signup.confirmed) return res.status(400).json({ error: 'Allerede bekræftet' });

    await db.execute({
      sql: `UPDATE volunteer_signups
            SET confirmed = 1, confirmed_by = ?, confirmed_at = datetime('now')
            WHERE signup_id = ?`,
      args: [req.user.user_id, req.params.signupId],
    });

    // Tildel badge
    const newBadge = await awardVolunteerBadge(db, signup.user_id);

    const updated = (await db.execute({
      sql: `SELECT vs.*, u.name as user_name FROM volunteer_signups vs
            JOIN users u ON vs.user_id = u.user_id
            WHERE vs.signup_id = ?`,
      args: [req.params.signupId],
    })).rows[0];

    res.json({
      message: `🎖️ Frivillig bekræftet!${newBadge ? ` Badge "${newBadge.name}" tildelt!` : ''}`,
      signup: updated,
      new_badge: newBadge || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

module.exports = router;
