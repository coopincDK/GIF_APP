const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');
const { getCache, syncFootball } = require('../services/footballSync');

const router = express.Router();

// ── Normalisér kamp-objekt ────────────────────────────────────────────────────
function normalizeMatch(m) {
  return {
    id:         m.id,
    date:       m.utcDate,
    status:     m.status, // SCHEDULED, LIVE, IN_PLAY, PAUSED, FINISHED
    home_team:  m.homeTeam?.shortName || m.homeTeam?.name,
    away_team:  m.awayTeam?.shortName || m.awayTeam?.name,
    home_crest: m.homeTeam?.crest,
    away_crest: m.awayTeam?.crest,
    home_score: m.score?.fullTime?.home ?? null,
    away_score: m.score?.fullTime?.away ?? null,
    matchday:   m.matchday,
  };
}

// ── GET /api/football — Superliga data (alle brugere) ─────────────────────────
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const apiKeySet = !!process.env.FOOTBALL_DATA_API_KEY;

    const matchCache    = await getCache(db, 'superliga_matches');
    const standingCache = await getCache(db, 'superliga_standings');
    const scorerCache   = await getCache(db, 'superliga_scorers');

    // Normalisér kampe
    const now = new Date();
    const allMatches = matchCache?.data || [];

    const recent = allMatches
      .filter(m => new Date(m.utcDate) < now)
      .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
      .slice(0, 6)
      .map(normalizeMatch);

    const upcoming = allMatches
      .filter(m => new Date(m.utcDate) >= now)
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
      .slice(0, 5)
      .map(normalizeMatch);

    res.json({
      api_key_configured: apiKeySet,
      last_sync: matchCache?.fetched_at || null,
      recent,
      upcoming,
      standings: standingCache?.data || [],
      scorers:   scorerCache?.data || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// ── POST /api/football/sync — manuel sync (kun admin) ─────────────────────────
router.post('/sync', authenticateToken, adminOnly, async (req, res) => {
  try {
    await syncFootball();
    res.json({ message: 'Superliga data synkroniseret! ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
