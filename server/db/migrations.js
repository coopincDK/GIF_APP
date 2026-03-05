/**
 * Database Migrations
 * -------------------
 * Hver migration har et unikt version-nummer.
 * Køres automatisk ved server-start — kun nye migrationer eksekveres.
 * Tilføj altid NYE migrationer NEDERST med næste version-nummer.
 */

const MIGRATIONS = [
  {
    version: 1,
    description: 'Opret migrations-tabel (bootstrap)',
    up: async (db) => {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version     INTEGER PRIMARY KEY,
          description TEXT NOT NULL,
          applied_at  TEXT DEFAULT (datetime('now'))
        )
      `);
    },
  },
  {
    version: 2,
    description: 'Tilføj created_by til content-tabel',
    up: async (db) => {
      const cols = (await db.execute('PRAGMA table_info(content)')).rows;
      if (!cols.some(c => c.name === 'created_by')) {
        await db.execute('ALTER TABLE content ADD COLUMN created_by TEXT REFERENCES users(user_id)');
      }
    },
  },
  {
    version: 3,
    description: 'Tilføj note til weekly_awards',
    up: async (db) => {
      const cols = (await db.execute('PRAGMA table_info(weekly_awards)')).rows;
      if (!cols.some(c => c.name === 'note')) {
        await db.execute('ALTER TABLE weekly_awards ADD COLUMN note TEXT');
      }
    },
  },
  {
    version: 4,
    description: 'Tilføj is_swap_offered til task_assignments',
    up: async (db) => {
      const cols = (await db.execute('PRAGMA table_info(task_assignments)')).rows;
      if (!cols.some(c => c.name === 'is_swap_offered')) {
        await db.execute('ALTER TABLE task_assignments ADD COLUMN is_swap_offered INTEGER DEFAULT 0');
      }
    },
  },
  {
    version: 5,
    description: 'Tilføj profile_picture_url til users hvis mangler',
    up: async (db) => {
      const cols = (await db.execute('PRAGMA table_info(users)')).rows;
      if (!cols.some(c => c.name === 'profile_picture_url')) {
        await db.execute('ALTER TABLE users ADD COLUMN profile_picture_url TEXT');
      }
    },
  },
  {
    version: 6,
    description: 'Tilføj phone_number til users hvis mangler',
    up: async (db) => {
      const cols = (await db.execute('PRAGMA table_info(users)')).rows;
      if (!cols.some(c => c.name === 'phone_number')) {
        await db.execute('ALTER TABLE users ADD COLUMN phone_number TEXT');
      }
    },
  },
  // ─── Tilføj nye migrationer herunder ───────────────────────────────────────
  // {
  //   version: 7,
  //   description: 'Beskrivelse af hvad der ændres',
  //   up: async (db) => {
  //     await db.execute('ALTER TABLE ...');
  //   },
  // },
  {
    version: 7,
    description: 'Tilføj player_name til invite_tokens',
    up: async (db) => {
      const cols = (await db.execute('PRAGMA table_info(invite_tokens)')).rows;
      if (!cols.some(c => c.name === 'player_name')) {
        await db.execute({ sql: 'ALTER TABLE invite_tokens ADD COLUMN player_name TEXT', args: [] });
      }
    },
  },
];

/**
 * Kør alle migrationer der ikke allerede er kørt.
 * Sikker at kalde ved hver server-start.
 */
async function runMigrations(db) {
  // Sørg for at migrations-tabellen eksisterer (bootstrap)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      applied_at  TEXT DEFAULT (datetime('now'))
    )
  `);

  // Hent allerede kørte versioner
  const applied = new Set(
    (await db.execute('SELECT version FROM schema_migrations')).rows.map(r => Number(r.version))
  );

  let ran = 0;
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) continue;

    try {
      await migration.up(db);
      await db.execute({
        sql: 'INSERT INTO schema_migrations (version, description) VALUES (?, ?)',
        args: [migration.version, migration.description],
      });
      console.log(`✅ Migration v${migration.version}: ${migration.description}`);
      ran++;
    } catch (err) {
      console.error(`❌ Migration v${migration.version} fejlede:`, err.message);
      // Fortsæt med næste — blød fejl så serveren ikke crasher
    }
  }

  if (ran === 0) {
    console.log('✅ Database up-to-date (ingen nye migrationer)');
  } else {
    console.log(`✅ ${ran} migration(er) kørt`);
  }
}

module.exports = { runMigrations };
