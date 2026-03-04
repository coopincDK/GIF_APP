const https = require('https');
const { getDb } = require('../db/database');

const API_KEY = process.env.FOOTBALL_DATA_API_KEY || '';
const BASE_URL = 'https://api.football-data.org/v4';

// Dansk Superliga competition ID på football-data.org
// Tier-4 plan: DSL (Superliga). Gratis plan dækker kun tier 1-3 (PL, BL, SA osv.)
// Vi prøver DSL først, fallback til at hente alle tilgængelige kampe
const COMPETITION = 'DSL';

function fetchFootball(path) {
  return new Promise((resolve, reject) => {
    if (!API_KEY) {
      reject(new Error('FOOTBALL_DATA_API_KEY ikke sat'));
      return;
    }
    const options = {
      hostname: 'api.football-data.org',
      path: `/v4${path}`,
      headers: { 'X-Auth-Token': API_KEY }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          // Rate limit eller fejl fra API
          if (parsed.errorCode) reject(new Error(parsed.message || 'API fejl'));
          else resolve(parsed);
        } catch (e) {
          reject(new Error('Ugyldig JSON: ' + data.slice(0, 100)));
        }
      });
    }).on('error', reject);
  });
}

async function setCache(db, key, data) {
  await db.execute({
    sql: `INSERT OR REPLACE INTO dbu_cache (cache_key, data, fetched_at) VALUES (?, ?, datetime('now'))`,
    args: [key, JSON.stringify(data)]
  });
}

async function getCache(db, key) {
  const row = (await db.execute({
    sql: `SELECT data, fetched_at FROM dbu_cache WHERE cache_key = ?`,
    args: [key]
  })).rows[0];
  if (!row) return null;
  return { data: JSON.parse(row.data), fetched_at: row.fetched_at };
}

async function syncFootball() {
  if (!API_KEY) {
    console.log('⚠️  FOOTBALL_DATA_API_KEY ikke sat — springer football sync over');
    return;
  }
  const db = getDb();
  console.log('🔄 Synkroniserer Superliga data fra football-data.org...');

  try {
    // Seneste kampe (sidste 30 dage) + næste 60 dage for at få hele sæsonen
    const dateFrom = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const dateTo   = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
    const matches  = await fetchFootball(`/competitions/${COMPETITION}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`);
    await setCache(db, 'superliga_matches', matches.matches || []);
    console.log(`✅ Superliga: ${(matches.matches || []).length} kampe hentet (${dateFrom} → ${dateTo})`);
  } catch (e) {
    console.error('❌ Superliga matches fejl:', e.message);
  }

  try {
    // Stilling
    const standings = await fetchFootball(`/competitions/${COMPETITION}/standings`);
    await setCache(db, 'superliga_standings', standings.standings?.[0]?.table || []);
    console.log(`✅ Superliga: stilling hentet`);
  } catch (e) {
    console.error('❌ Superliga standings fejl:', e.message);
  }

  try {
    // Top scorers
    const scorers = await fetchFootball(`/competitions/${COMPETITION}/scorers?limit=10`);
    await setCache(db, 'superliga_scorers', scorers.scorers || []);
    console.log(`✅ Superliga: top scorers hentet`);
  } catch (e) {
    console.error('❌ Superliga scorers fejl:', e.message);
  }
}

// Sync hver 6. time (football-data.org gratis = 10 req/min, vi laver 3 req per sync)
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

function startFootballSync() {
  if (process.env.FOOTBALL_DATA_API_KEY) {
    syncFootball();
  } else {
    console.log('ℹ️  Football-data.org: Ingen API-nøgle — sæt FOOTBALL_DATA_API_KEY for at aktivere Superliga-widget');
  }
  setInterval(syncFootball, SYNC_INTERVAL_MS);
  console.log('⏰ Superliga sync planlagt (hver 6. time)');
}

module.exports = { syncFootball, startFootballSync, getCache };
