const https = require('https');
const { getDb } = require('../db/database');

const DBU_API_BASE = 'https://clubservice.dbu.dk/api';
const API_KEY = process.env.DBU_API_KEY || '';

// DBU_TEAM_ID = det specifikke hold-ID for Grenå IF U10/U11
// Fås fra DBU KlubAdmin → Hold → vælg holdet → se ID i URL
// Eks: "12345" — IKKE hele klubbens ID!
const TEAM_ID = process.env.DBU_TEAM_ID || '';

// ── Hent data fra DBU API ─────────────────────────────────────────────────────
function fetchDbu(path) {
  return new Promise((resolve, reject) => {
    if (!API_KEY) {
      reject(new Error('DBU_API_KEY ikke sat i environment'));
      return;
    }
    // Tilføj APIKey til URL (håndter om der allerede er query params)
    const sep = path.includes('?') ? '&' : '?';
    const url = `${DBU_API_BASE}${path}${sep}APIKey=${API_KEY}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Ugyldig JSON fra DBU API: ' + data.slice(0, 100))); }
      });
    }).on('error', reject);
  });
}

// ── Hold-filtrering ───────────────────────────────────────────────────────────
// DBU API returnerer data for HELE klubben — vi filtrerer ned til U10/U11 holdet.
// Prioritet: 1) eksakt TeamId match, 2) holdnavn indeholder U10/U11/Grenå
function filterByTeam(items, teamId) {
  if (!Array.isArray(items) || items.length === 0) return items;
  if (!teamId) return items; // ingen filter = vis alt

  // Forsøg eksakt ID-match først
  const byId = items.filter(item => {
    const ids = [item.TeamId, item.HomeTeamId, item.AwayTeamId, item.teamId]
      .map(String);
    return ids.includes(String(teamId));
  });
  if (byId.length > 0) return byId;

  // Fallback: filtrer på holdnavn (U10, U11, Grenå)
  console.log('⚠️  DBU: Ingen eksakt TeamId match — filtrerer på holdnavn');
  return items.filter(item => {
    const name = [
      item.TeamName, item.HomeTeam, item.AwayTeam,
      item.HomeTeamName, item.AwayTeamName, item.teamName
    ].join(' ').toLowerCase();
    return name.includes('u10') || name.includes('u11') ||
           name.includes('grenå') || name.includes('grenaa');
  });
}

// ── Cache helpers ─────────────────────────────────────────────────────────────
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

// ── Hoved-sync ────────────────────────────────────────────────────────────────
async function syncDbu() {
  if (!API_KEY) {
    console.log('⚠️  DBU_API_KEY ikke sat — springer DBU sync over');
    return;
  }
  const db = getDb();
  console.log(`🔄 Synkroniserer DBU data for hold ${TEAM_ID || 'alle (intet TEAM_ID sat)'}...`);

  // Kampe — send TeamId direkte i URL hvis muligt (reducerer datamængde fra DBU)
  try {
    const matchPath = TEAM_ID ? `/Match?TeamId=${TEAM_ID}` : '/Match';
    const allMatches = await fetchDbu(matchPath);
    // Filtrer igen som sikkerhedsnet (DBU ignorerer somme tider TeamId param)
    const matches = filterByTeam(allMatches, TEAM_ID);
    await setCache(db, 'matches', matches);
    console.log(`✅ DBU kampe: ${matches.length} (ud af ${Array.isArray(allMatches) ? allMatches.length : '?'} total for klubben)`);
  } catch (e) {
    console.error('❌ DBU matches fejl:', e.message);
  }

  // Træninger — filtrer på hold
  try {
    const allTrainings = await fetchDbu('/Training');
    const trainings = filterByTeam(allTrainings, TEAM_ID);
    await setCache(db, 'trainings', trainings);
    console.log(`✅ DBU træninger: ${trainings.length} (ud af ${Array.isArray(allTrainings) ? allTrainings.length : '?'} total)`);
  } catch (e) {
    console.error('❌ DBU trainings fejl:', e.message);
  }

  // Stilling — find den række holdet spiller i
  try {
    const allStandings = await fetchDbu('/Standing');
    // Stilling er en liste af hold i en række — filtrer til den række vores hold er i
    const standings = filterByTeam(allStandings, TEAM_ID);
    await setCache(db, 'standings', standings);
    console.log(`✅ DBU stilling: ${Array.isArray(standings) ? standings.length : 0} hold i rækken`);
  } catch (e) {
    console.error('❌ DBU standings fejl:', e.message);
  }
}

// ── Auto-sync hver 12. time ───────────────────────────────────────────────────
const SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 timer

function startDbuSync() {
  if (process.env.DBU_API_KEY) {
    syncDbu(); // Kør straks ved opstart
  } else {
    console.log('ℹ️  DBU: Ingen API-nøgle — auto-sync deaktiveret. Sæt DBU_API_KEY for at aktivere.');
  }
  // Planlæg sync hver 12. time (kører selv om API-nøgle mangler — logger bare warning)
  setInterval(syncDbu, SYNC_INTERVAL_MS);
  console.log('⏰ DBU sync planlagt (hver 12. time) — manuel sync: POST /api/schedule/sync');
}

module.exports = { syncDbu, startDbuSync, getCache };
