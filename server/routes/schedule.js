const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { getCache } = require('../services/dbuSync');

const router = express.Router();

// GET /api/schedule — kampe + træninger (alle brugere kan se)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const apiKeySet = !!process.env.DBU_API_KEY;

    const matchCache    = await getCache(db, 'matches');
    const trainingCache = await getCache(db, 'trainings');
    const standingCache = await getCache(db, 'standings');

    // Normalisér kampe til et simpelt format
    const now = new Date();
    const matches = (matchCache?.data || [])
      .map(m => ({
        id:         m.MatchId || m.Id || m.id,
        date:       m.MatchDate || m.Date || m.date,
        time:       m.MatchTime || m.Time || m.time,
        home_team:  m.HomeTeam || m.HomeTeamName || m.home_team,
        away_team:  m.AwayTeam || m.AwayTeamName || m.away_team,
        venue:      m.Venue || m.venue || 'Grenå Stadion',
        home_score: m.HomeScore ?? m.home_score ?? null,
        away_score: m.AwayScore ?? m.away_score ?? null,
        is_home:    (m.HomeTeam || '').toLowerCase().includes('gren'),
        type:       'match',
      }))
      .filter(m => m.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const trainings = (trainingCache?.data || [])
      .map(t => ({
        id:       t.TrainingId || t.Id || t.id,
        date:     t.TrainingDate || t.Date || t.date,
        time:     t.StartTime || t.Time || t.time,
        end_time: t.EndTime || t.end_time,
        venue:    t.Venue || t.venue || 'Grenå Stadion',
        note:     t.Note || t.note || '',
        type:     'training',
      }))
      .filter(t => t.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Kommende events (de næste 30 dage)
    const upcoming = [...matches, ...trainings]
      .filter(e => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 20);

    res.json({
      api_key_configured: apiKeySet,
      last_sync: matchCache?.fetched_at || null,
      upcoming,
      matches,
      trainings,
      standings: standingCache?.data || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// POST /api/schedule/sync — manuel sync (admin only)
const { adminOnly } = require('../middleware/adminOnly');
const { syncDbu } = require('../services/dbuSync');

router.post('/sync', authenticateToken, adminOnly, async (req, res) => {
  try {
    await syncDbu();
    res.json({ message: 'DBU data synkroniseret! ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
