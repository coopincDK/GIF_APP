const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./database');

async function seed() {
  const db = getDb();

  // ── Teams ────────────────────────────────────────────────────────────────────
  const teamExists = (await db.execute({ sql: 'SELECT 1 FROM teams WHERE team_id = ?', args: ['grenaa-u10-11'] })).rows[0];
  if (!teamExists) {
    await db.execute({ sql: 'INSERT INTO teams (team_id, team_name) VALUES (?, ?)', args: ['grenaa-u10-11', 'Grenå IF U10/U11'] });
    console.log('✅ Team seedet');
  }

  // ── Admin bruger ─────────────────────────────────────────────────────────────
  const adminExists = (await db.execute({ sql: 'SELECT 1 FROM users WHERE email = ?', args: ['admin@grenaaif.dk'] })).rows[0];
  if (!adminExists) {
    const passwordHash = bcrypt.hashSync('GrenaaIF2026!', 10);
    await db.execute({
      sql: 'INSERT INTO users (user_id, name, email, password_hash, role, team_id) VALUES (?, ?, ?, ?, ?, ?)',
      args: [uuidv4(), 'Holdleder', 'admin@grenaaif.dk', passwordHash, 'admin', 'grenaa-u10-11']
    });
    console.log('✅ Admin bruger seedet');
  }

  // ── Badges ───────────────────────────────────────────────────────────────────
  const badgesData = [
    { name: 'Hold-Helt',          description: 'Fuldført en holdopgave!',              image_url: '/assets/stickers/16_vaskemaskine.png', type: 'liga' },
    { name: 'Frugt-Helt',         description: 'Medbragt frugt til holdet!',            image_url: '/assets/stickers/17_frugtskaal.png',   type: 'liga' },
    { name: 'Kage-Helt',          description: 'Medbragt kage til holdet!',             image_url: '/assets/stickers/07_guldpokal.png',    type: 'liga' },
    { name: 'Cup-Stjerne',        description: 'Frivillig ved Kattegat Cup!',           image_url: '/assets/stickers/23_kattegat_cup.png', type: 'cup' },
    { name: 'Jubilæums-Helt 2026',description: 'Bidrog til 40-års jubilæumsstævnet!',  image_url: '/assets/stickers/27_medalje.png',      type: 'jubilæum' },
    { name: 'High Five',          description: 'Givet en holdkammerat en high five!',   image_url: '/assets/stickers/04_high_five.png',    type: 'liga' },
    { name: 'Trænings-Helt',      description: 'Mødt til træning med godt humør!',      image_url: '/assets/stickers/13_sved_traening.png',type: 'liga' },
    { name: 'Ild-Spiller',        description: 'Vist ekstra energi på banen!',          image_url: '/assets/stickers/15_ild_fart.png',     type: 'liga' },
  ];

  for (const badge of badgesData) {
    const exists = (await db.execute({ sql: 'SELECT 1 FROM badges WHERE name = ?', args: [badge.name] })).rows[0];
    if (!exists) {
      await db.execute({
        sql: 'INSERT INTO badges (badge_id, name, description, image_url, type) VALUES (?, ?, ?, ?, ?)',
        args: [uuidv4(), badge.name, badge.description, badge.image_url, badge.type]
      });
    }
  }
  console.log('✅ Badges seedet');

  // ── Standard opgaver ─────────────────────────────────────────────────────────
  const tasksData = [
    { title: 'Tøjvask',   description: 'Vask holdets trøjer og shorts efter kampen',  type: 'liga' },
    { title: 'Frugt med', description: 'Medbring frugt til holdet til træning/kamp',  type: 'liga' },
    { title: 'Kage med',  description: 'Medbring kage til holdet efter kampen',        type: 'liga' },
  ];

  for (const task of tasksData) {
    const exists = (await db.execute({ sql: 'SELECT 1 FROM tasks WHERE title = ? AND team_id = ?', args: [task.title, 'grenaa-u10-11'] })).rows[0];
    if (!exists) {
      await db.execute({
        sql: "INSERT INTO tasks (task_id, title, description, type, status, team_id) VALUES (?, ?, ?, ?, 'open', ?)",
        args: [uuidv4(), task.title, task.description, task.type, 'grenaa-u10-11']
      });
    }
  }
  console.log('✅ Standard opgaver seedet');

  // ── Content: Regler & Facts ──────────────────────────────────────────────────
  const contentData = [
    { type: 'regel', title: 'Mødepligt',   body_text: 'Alle spillere møder op 15 minutter før kampstart. Vis respekt for holdkammeraterne ved at være til tiden.', sort_order: 1 },
    { type: 'regel', title: 'Fair Play',   body_text: 'Vi spiller fair og respekterer modstandere, dommere og tilskuere. Grimme tacklinger og dårlig sportsånd accepteres ikke.', sort_order: 2 },
    { type: 'regel', title: 'Holdånd',     body_text: 'Vi hepper på hinanden, også når det er svært. Alle på holdet er lige vigtige – fra keeper til angriber.', sort_order: 3 },
    { type: 'regel', title: 'Presfri Zone', body_text: 'Ved målspark i U10 (5v5) må modstanderne ikke presse inden for den presfri zone. Keeperen kan spille bolden roligt ud.', sort_order: 4 },
    { type: 'regel', title: 'Tilbagelægning', body_text: 'Hvis en spiller spiller bolden tilbage til sin egen keeper med foden, MÅ keeperen ikke tage bolden med hænderne. Keeperen skal spille med fødderne!', sort_order: 5 },
    { type: 'fact',  title: 'Vidste du?',  body_text: 'En fodboldspiller løber i gennemsnit 10-12 km per kamp. Det svarer til at løbe fra Grenå centrum til Gjerrild!', sort_order: 1 },
    { type: 'fact',  title: 'Grenå IF fylder 40!', body_text: 'I 2026 fejrer Grenå IF sit 40-års jubilæum med det store Kattegat Cup stævne. En kæmpe fejring for hele klubben!', sort_order: 2 },
    { type: 'fact',  title: 'Boldspillets magi', body_text: 'Fodbold spilles i over 200 lande og er verdens mest populære sport med over 250 millioner aktive spillere!', sort_order: 3 },
    { type: 'fact',  title: 'Den hurtigste aflevering', body_text: 'Den hurtigste aflevering i fodboldhistorien blev målt til over 210 km/t! Det er hurtigere end et tog!', sort_order: 4 },
  ];

  for (const item of contentData) {
    const exists = (await db.execute({ sql: 'SELECT 1 FROM content WHERE title = ? AND type = ?', args: [item.title, item.type] })).rows[0];
    if (!exists) {
      await db.execute({
        sql: 'INSERT INTO content (content_id, type, title, body_text, sort_order) VALUES (?, ?, ?, ?, ?)',
        args: [uuidv4(), item.type, item.title, item.body_text, item.sort_order]
      });
    }
  }
  console.log('✅ Content (regler + facts) seedet');

  // ── App Settings ─────────────────────────────────────────────────────────────
  await db.execute({ sql: "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('cup_mode_override', 'auto')", args: [] });
  console.log('✅ App settings seedet');

  console.log('🎉 Seed færdig!');
}

module.exports = { seed };
