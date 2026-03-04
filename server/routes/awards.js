const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

// Alle gyldige kategorier (udvides løbende — ingen hård validering)
const VALID_CATEGORIES = null; // null = accepter alle

// GET /api/awards/latest — seneste uge med mindst én award (fallback til tom)
router.get('/latest', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const latest = (await db.execute({
      sql: `SELECT week_number, year FROM weekly_awards
            ORDER BY year DESC, week_number DESC LIMIT 1`,
      args: []
    })).rows[0];

    if (!latest) return res.json({ week: null, year: null, awards: [] });

    const awards = (await db.execute({
      sql: `SELECT wa.award_id, wa.category, wa.week_number, wa.year, wa.note,
                   u.user_id, u.name as user_name, u.profile_picture_url
            FROM weekly_awards wa
            JOIN users u ON wa.user_id = u.user_id
            WHERE wa.week_number = ? AND wa.year = ?
            ORDER BY wa.created_at ASC`,
      args: [latest.week_number, latest.year]
    })).rows;

    res.json({ week: latest.week_number, year: latest.year, awards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/awards/week?week=X&year=Y  — alle kan se ugens helte
router.get('/week', authenticateToken, async (req, res) => {
  try {
    const { week, year } = req.query;
    if (!week || !year) return res.status(400).json({ error: 'week og year er påkrævet' });

    const db = getDb();
    const awards = (await db.execute({
      sql: `SELECT wa.award_id, wa.category, wa.week_number, wa.year, wa.note, wa.created_at,
                   u.user_id, u.name as user_name, u.profile_picture_url,
                   ab.name as awarded_by_name
            FROM weekly_awards wa
            JOIN users u ON wa.user_id = u.user_id
            LEFT JOIN users ab ON wa.awarded_by = ab.user_id
            WHERE wa.week_number = ? AND wa.year = ?
            ORDER BY wa.category`,
      args: [parseInt(week), parseInt(year)],
    })).rows;

    res.json(awards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// GET /api/awards/stats/year?year=Y  — kun admin — årsstatistik
router.get('/stats/year', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) return res.status(400).json({ error: 'year er påkrævet' });

    const db = getDb();

    // Hent alle awards for året med brugerinfo
    const rows = (await db.execute({
      sql: `SELECT wa.category, wa.user_id, u.name as user_name, u.profile_picture_url,
                   COUNT(*) as count
            FROM weekly_awards wa
            JOIN users u ON wa.user_id = u.user_id
            WHERE wa.year = ?
            GROUP BY wa.user_id, wa.category
            ORDER BY u.name, wa.category`,
      args: [parseInt(year)],
    })).rows;

    // Byg pivot-struktur: { userId: { user_name, fighter: N, ..., total: N } }
    const playerMap = {};
    for (const row of rows) {
      if (!playerMap[row.user_id]) {
        playerMap[row.user_id] = {
          user_id: row.user_id,
          user_name: row.user_name,
          profile_picture_url: row.profile_picture_url,
          fighter: 0, udvikling: 0, ven: 0, spiller: 0, fokus: 0, energi: 0,
          total: 0,
        };
      }
      playerMap[row.user_id][row.category] = row.count;
      playerMap[row.user_id].total += row.count;
    }

    const stats = Object.values(playerMap).sort((a, b) => b.total - a.total);
    res.json({ year: parseInt(year), players: stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// GET /api/awards/leaderboard — samlet point-oversigt (admin only)
router.get('/leaderboard', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const teamId = req.user.team_id;

    // Alle brugere på holdet
    const users = (await db.execute({
      sql: `SELECT user_id, name, profile_picture_url FROM users WHERE team_id = ? AND role = 'user' ORDER BY name`,
      args: [teamId]
    })).rows;

    const result = [];
    for (const user of users) {
      const badgeCount = (await db.execute({
        sql: `SELECT COUNT(*) as c FROM user_badges WHERE user_id = ?`,
        args: [user.user_id]
      })).rows[0].c;

      const awardCount = (await db.execute({
        sql: `SELECT COUNT(*) as c FROM weekly_awards WHERE user_id = ?`,
        args: [user.user_id]
      })).rows[0].c;

      const volunteerCount = (await db.execute({
        sql: `SELECT COUNT(*) as c FROM volunteer_signups WHERE user_id = ? AND confirmed = 1`,
        args: [user.user_id]
      })).rows[0].c;

      const laundryCount = (await db.execute({
        sql: `SELECT COUNT(*) as c FROM task_assignments ta
              JOIN tasks t ON ta.task_id = t.task_id
              WHERE ta.user_id = ? AND t.type = 'tøjvask'`,
        args: [user.user_id]
      })).rows[0].c;

      // Seneste award
      const latestAward = (await db.execute({
        sql: `SELECT category, week_number, year FROM weekly_awards WHERE user_id = ? ORDER BY year DESC, week_number DESC LIMIT 1`,
        args: [user.user_id]
      })).rows[0];

      result.push({
        user_id: user.user_id,
        name: user.name,
        profile_picture_url: user.profile_picture_url,
        badge_count: Number(badgeCount),
        award_count: Number(awardCount),
        volunteer_count: Number(volunteerCount),
        laundry_count: Number(laundryCount),
        total_score: Number(badgeCount) + Number(awardCount) + Number(volunteerCount),
        latest_award: latestAward || null,
      });
    }

    // Sorter efter total score
    result.sort((a, b) => b.total_score - a.total_score);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/awards  — admin tildeler award
router.post('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    // Accepter både camelCase (userId, weekNumber) og snake_case (user_id, week_number)
    const userId     = req.body.userId     || req.body.user_id;
    const category   = req.body.category;
    const weekNumber = req.body.weekNumber || req.body.week_number;
    const year       = req.body.year;
    const note       = req.body.note || null;
    if (!userId || !category || !weekNumber || !year)
      return res.status(400).json({ error: 'user_id, category, week_number og year er påkrævet' });

    const db = getDb();
    const awardId = uuidv4();

    try {
      await db.execute({
        sql: `INSERT INTO weekly_awards (award_id, user_id, category, week_number, year, awarded_by, note)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [awardId, userId, category, parseInt(weekNumber), parseInt(year), req.user.user_id, note || null],
      });
    } catch (dbErr) {
      if (dbErr.message && dbErr.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Denne spiller har allerede fået denne award i den uge' });
      }
      throw dbErr;
    }

    const award = (await db.execute({
      sql: `SELECT wa.*, u.name as user_name, u.profile_picture_url
            FROM weekly_awards wa
            JOIN users u ON wa.user_id = u.user_id
            WHERE wa.award_id = ?`,
      args: [awardId],
    })).rows[0];

    res.status(201).json({ message: `🏆 ${award.user_name} er Ugens Helt i kategorien "${category}"!`, award });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// DELETE /api/awards/:awardId  — admin sletter award
router.delete('/:awardId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const existing = (await db.execute({
      sql: 'SELECT 1 FROM weekly_awards WHERE award_id = ?',
      args: [req.params.awardId],
    })).rows[0];

    if (!existing) return res.status(404).json({ error: 'Award ikke fundet' });

    await db.execute({ sql: 'DELETE FROM weekly_awards WHERE award_id = ?', args: [req.params.awardId] });
    res.json({ message: 'Award slettet' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

module.exports = router;
