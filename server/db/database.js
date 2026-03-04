const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');
const { runMigrations } = require('./migrations');

const DB_PATH = path.join(__dirname, 'gif_app.db');
let client;

function getDb() {
  if (!client) {
    client = createClient({ url: `file:${DB_PATH}` });
  }
  return client;
}

async function initDb() {
  const db = getDb();
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  // Kør hvert statement separat (libsql kræver det)
  const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    await db.execute(stmt);
  }
  // Sæt pragmas
  await db.execute('PRAGMA journal_mode = WAL');
  await db.execute('PRAGMA foreign_keys = ON');

  // Kør versionerede migrationer
  await runMigrations(db);

  console.log('✅ Database initialiseret');
}

module.exports = { getDb, initDb };
