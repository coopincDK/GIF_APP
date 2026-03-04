const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./database');
const { seedContent } = require('./contentSeed');

async function seed() {
  const db = getDb();

  // ── Teams ─────────────────────────────────────────────────────────────────
  const teamExists = (await db.execute({ sql: 'SELECT 1 FROM teams WHERE team_id = ?', args: ['grenaa-u10-11'] })).rows[0];
  if (!teamExists) {
    await db.execute({ sql: 'INSERT INTO teams (team_id, team_name) VALUES (?, ?)', args: ['grenaa-u10-11', 'Grenå IF U10/U11'] });
    console.log('✅ Team seedet');
  }

  // ── Admin bruger ──────────────────────────────────────────────────────────
  const adminExists = (await db.execute({ sql: 'SELECT 1 FROM users WHERE email = ?', args: ['admin@grenaaif.dk'] })).rows[0];
  if (!adminExists) {
    const passwordHash = bcrypt.hashSync('GrenaaIF2026!', 10);
    await db.execute({
      sql: 'INSERT INTO users (user_id, name, email, password_hash, role, team_id, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [uuidv4(), 'Holdleder', 'admin@grenaaif.dk', passwordHash, 'admin', 'grenaa-u10-11', '12345678']
    });
    console.log('✅ Admin bruger seedet');
  }

  // ── Demo forældre (testbrugere) ───────────────────────────────────────────
  const demoUsers = [
    { name: 'Mette Hansen',   email: 'mette@test.dk',   phone: '20123456' },
    { name: 'Lars Pedersen',  email: 'lars@test.dk',    phone: '21234567' },
    { name: 'Sofie Nielsen',  email: 'sofie@test.dk',   phone: '22345678' },
    { name: 'Thomas Jensen',  email: 'thomas@test.dk',  phone: '23456789' },
    { name: 'Camilla Møller', email: 'camilla@test.dk', phone: '24567890' },
    { name: 'Rasmus Koch',    email: 'rasmus@test.dk',  phone: '25678901' },
  ];

  const demoUserIds = {};
  for (const u of demoUsers) {
    const exists = (await db.execute({ sql: 'SELECT user_id FROM users WHERE email = ?', args: [u.email] })).rows[0];
    if (!exists) {
      const id = uuidv4();
      const hash = bcrypt.hashSync('Test1234!', 10);
      await db.execute({
        sql: 'INSERT INTO users (user_id, name, email, password_hash, role, team_id, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [id, u.name, u.email, hash, 'user', 'grenaa-u10-11', u.phone]
      });
      demoUserIds[u.email] = id;
    } else {
      demoUserIds[u.email] = exists.user_id;
    }
  }
  console.log('✅ Demo brugere seedet (password: Test1234!)');

  // ── Badges ────────────────────────────────────────────────────────────────
  const badgesData = [
    { name: 'Hold-Helt',           description: 'Fuldført en holdopgave!',             image_url: '/assets/stickers/16_vaskemaskine.png', type: 'liga' },
    { name: 'Frugt-Helt',          description: 'Medbragt frugt til holdet!',           image_url: '/assets/stickers/17_frugtskaal.png',   type: 'liga' },
    { name: 'Kage-Helt',           description: 'Medbragt kage til holdet!',            image_url: '/assets/stickers/07_guldpokal.png',    type: 'liga' },
    { name: 'Cup-Stjerne',         description: 'Frivillig ved Kattegat Cup!',          image_url: '/assets/stickers/23_kattegat_cup.png', type: 'cup' },
    { name: 'Jubilæums-Helt 2026', description: 'Bidrog til 40-års jubilæumsstævnet!', image_url: '/assets/stickers/27_medalje.png',      type: 'jubilæum' },
    { name: 'High Five',           description: 'Givet en holdkammerat en high five!',  image_url: '/assets/stickers/04_high_five.png',    type: 'liga' },
    { name: 'Trænings-Helt',       description: 'Mødt til træning med godt humør!',     image_url: '/assets/stickers/13_sved_traening.png',type: 'liga' },
    { name: 'Ild-Spiller',         description: 'Vist ekstra energi på banen!',         image_url: '/assets/stickers/15_ild_fart.png',     type: 'liga' },
  ];

  const badgeIds = {};
  for (const badge of badgesData) {
    const exists = (await db.execute({ sql: 'SELECT badge_id FROM badges WHERE name = ?', args: [badge.name] })).rows[0];
    if (!exists) {
      const id = uuidv4();
      await db.execute({
        sql: 'INSERT INTO badges (badge_id, name, description, image_url, type) VALUES (?, ?, ?, ?, ?)',
        args: [id, badge.name, badge.description, badge.image_url, badge.type]
      });
      badgeIds[badge.name] = id;
    } else {
      badgeIds[badge.name] = exists.badge_id;
    }
  }
  console.log('✅ Badges seedet');

  // ── Tildel demo-badges til testbrugere ───────────────────────────────────
  const demoBadgeAssignments = [
    { email: 'mette@test.dk',   badges: ['Hold-Helt', 'Frugt-Helt', 'High Five'] },
    { email: 'lars@test.dk',    badges: ['Hold-Helt', 'Kage-Helt'] },
    { email: 'sofie@test.dk',   badges: ['Frugt-Helt', 'Trænings-Helt', 'Ild-Spiller'] },
    { email: 'thomas@test.dk',  badges: ['Hold-Helt'] },
    { email: 'camilla@test.dk', badges: ['Cup-Stjerne', 'Hold-Helt', 'High Five'] },
    { email: 'rasmus@test.dk',  badges: ['Jubilæums-Helt 2026', 'Cup-Stjerne'] },
  ];

  for (const { email, badges } of demoBadgeAssignments) {
    const userId = demoUserIds[email];
    if (!userId) continue;
    for (const badgeName of badges) {
      const badgeId = badgeIds[badgeName];
      if (!badgeId) continue;
      const has = (await db.execute({ sql: 'SELECT 1 FROM user_badges WHERE user_id = ? AND badge_id = ?', args: [userId, badgeId] })).rows[0];
      if (!has) {
        await db.execute({
          sql: 'INSERT INTO user_badges (user_badge_id, user_id, badge_id) VALUES (?, ?, ?)',
          args: [uuidv4(), userId, badgeId]
        });
      }
    }
  }
  console.log('✅ Demo badges tildelt');

  // ── Standard opgaver ──────────────────────────────────────────────────────
  const tasksData = [
    { title: 'Tøjvask',   description: 'Vask holdets trøjer og shorts efter kampen',  type: 'liga' },
    { title: 'Frugt med', description: 'Medbring frugt til holdet til træning/kamp',  type: 'liga' },
    { title: 'Kage med',  description: 'Medbring kage til holdet efter kampen',        type: 'liga' },
  ];

  const taskIds = {};
  for (const task of tasksData) {
    const exists = (await db.execute({ sql: 'SELECT task_id FROM tasks WHERE title = ? AND team_id = ?', args: [task.title, 'grenaa-u10-11'] })).rows[0];
    if (!exists) {
      const id = uuidv4();
      await db.execute({
        sql: "INSERT INTO tasks (task_id, title, description, type, status, team_id) VALUES (?, ?, ?, ?, 'open', ?)",
        args: [id, task.title, task.description, task.type, 'grenaa-u10-11']
      });
      taskIds[task.title] = id;
    } else {
      taskIds[task.title] = exists.task_id;
    }
  }
  console.log('✅ Standard opgaver seedet');

  // ── Demo opgave-tildelinger ───────────────────────────────────────────────
  // Tøjvask → Mette (tilbudt swap), Frugt → Lars (fuldført), Kage → Sofie (åben)
  const tøjvaskId = taskIds['Tøjvask'];
  const frugtId   = taskIds['Frugt med'];

  if (tøjvaskId && demoUserIds['mette@test.dk']) {
    const hasAssign = (await db.execute({ sql: 'SELECT 1 FROM task_assignments WHERE task_id = ?', args: [tøjvaskId] })).rows[0];
    if (!hasAssign) {
      await db.execute({
        sql: 'INSERT INTO task_assignments (assignment_id, task_id, user_id, is_swap_offered) VALUES (?, ?, ?, 1)',
        args: [uuidv4(), tøjvaskId, demoUserIds['mette@test.dk']]
      });
      await db.execute({ sql: "UPDATE tasks SET status = 'assigned' WHERE task_id = ?", args: [tøjvaskId] });
    }
  }

  if (frugtId && demoUserIds['lars@test.dk']) {
    const hasAssign = (await db.execute({ sql: 'SELECT 1 FROM task_assignments WHERE task_id = ?', args: [frugtId] })).rows[0];
    if (!hasAssign) {
      await db.execute({
        sql: "INSERT INTO task_assignments (assignment_id, task_id, user_id, completion_date) VALUES (?, ?, ?, datetime('now', '-3 days'))",
        args: [uuidv4(), frugtId, demoUserIds['lars@test.dk']]
      });
      await db.execute({ sql: "UPDATE tasks SET status = 'completed' WHERE task_id = ?", args: [frugtId] });
    }
  }
  console.log('✅ Demo opgave-tildelinger seedet');

  // ── Cup-vagter (demo) ─────────────────────────────────────────────────────
  const cupShifts = [
    { title: 'Telt-opstilling',    description: 'Hjælp med at sætte telte op ved ankomst', shift_date: '2026-07-23', start_time: '07:00', end_time: '09:00', max_volunteers: 4, icon_type: 'tent' },
    { title: 'Kiosk-vagt formiddag', description: 'Sælg vand, slik og hotdogs i kiosken',  shift_date: '2026-07-23', start_time: '09:00', end_time: '12:00', max_volunteers: 2, icon_type: 'food' },
    { title: 'Affaldssorterings-vagt', description: 'Sørg for at affald sorteres korrekt',  shift_date: '2026-07-23', start_time: '12:00', end_time: '15:00', max_volunteers: 2, icon_type: 'recycling' },
    { title: 'Parkerings-vagt',    description: 'Hjælp med at guide biler til parkering',   shift_date: '2026-07-23', start_time: '08:00', end_time: '10:00', max_volunteers: 3, icon_type: 'parking' },
    { title: 'Kiosk-vagt eftermiddag', description: 'Sælg vand, slik og hotdogs i kiosken', shift_date: '2026-07-24', start_time: '12:00', end_time: '16:00', max_volunteers: 2, icon_type: 'food' },
    { title: 'Oprydning og nedtagning', description: 'Hjælp med at rydde op efter stævnet', shift_date: '2026-07-24', start_time: '17:00', end_time: '20:00', max_volunteers: 5, icon_type: 'tent' },
  ];

  for (const shift of cupShifts) {
    const exists = (await db.execute({ sql: 'SELECT 1 FROM cup_shifts WHERE title = ? AND shift_date = ?', args: [shift.title, shift.shift_date] })).rows[0];
    if (!exists) {
      const shiftId = uuidv4();
      await db.execute({
        sql: 'INSERT INTO cup_shifts (shift_id, title, description, shift_date, start_time, end_time, max_volunteers, icon_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [shiftId, shift.title, shift.description, shift.shift_date, shift.start_time, shift.end_time, shift.max_volunteers, shift.icon_type]
      });

      // Tilmeld Camilla til første vagt som demo
      if (shift.title === 'Telt-opstilling' && demoUserIds['camilla@test.dk']) {
        await db.execute({
          sql: 'INSERT INTO cup_shift_signups (signup_id, shift_id, user_id) VALUES (?, ?, ?)',
          args: [uuidv4(), shiftId, demoUserIds['camilla@test.dk']]
        });
      }
    }
  }
  console.log('✅ Cup-vagter seedet');

  // ── Content: Regler & Facts (se contentSeed.js) ─────────────────────────
  await seedContent(db);

  // ── App Settings ──────────────────────────────────────────────────────────
  await db.execute({ sql: "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('cup_mode_override', 'auto')", args: [] });
  console.log('✅ App settings seedet');

  // ── Feature flags ──────────────────────────────────────────────────────────
  const defaultFlags = [
    // Kerne
    { key: 'spin_wheel',       label: '🎡 Tøjvask-hjul',         description: 'Spin-hjulet til tøjvask-fordeling',         category: 'core',     enabled: 1 },
    { key: 'volunteer_board',  label: '🙋 Frivillig-board',       description: 'Forældre kan melde sig til frugt/kage/kørsel', category: 'core',   enabled: 1 },
    { key: 'task_swap',        label: '🔄 Opgave-bytte',          description: 'Spillere kan tilbyde opgaver til bytte',     category: 'core',     enabled: 1 },
    // Hold & spillere
    { key: 'weekly_awards',    label: '🏅 Ugens Helte',           description: 'Ugentlige helte-titler efter kamp',          category: 'team',     enabled: 1 },
    { key: 'badges',           label: '💎 Badges & Skattekiste',  description: 'Badge-system og skattekiste-side',           category: 'team',     enabled: 1 },
    { key: 'team_page',        label: '🌟 Hold-siden',            description: 'Vis hele holdet med spillerkort',            category: 'team',     enabled: 1 },
    { key: 'leaderboard',      label: '📊 Point-historik',        description: 'Leaderboard og historik (kun admin)',        category: 'team',     enabled: 1 },
    // Indhold
    { key: 'daily_fact',       label: '💡 Dagens Fact/Joke',      description: 'Roterende facts og vittigheder på forsiden', category: 'content',  enabled: 1 },
    { key: 'coach_corner',     label: '📚 Trænerens Hjørne',      description: 'Regler og fakta-side',                       category: 'content',  enabled: 1 },
    // Kampprogram
    { key: 'schedule',         label: '📅 Kampprogram',           description: 'DBU kampprogram og træningsplan',            category: 'schedule', enabled: 1 },
    { key: 'upcoming_match',   label: '🏃 Næste kamp (forside)',  description: 'Vis næste kamp/træning på forsiden',         category: 'schedule', enabled: 1 },
    { key: 'superliga_widget', label: '🏆 Superliga-widget',      description: 'Superliga resultater og stilling',           category: 'schedule', enabled: 1 },
    // Cup
    { key: 'cup_mode',         label: '🏆 Kattegat Cup',          description: 'Cup-mode, nedtælling og Cup-vagter',         category: 'cup',      enabled: 1 },
  ];

  for (const flag of defaultFlags) {
    const exists = (await db.execute({ sql: 'SELECT 1 FROM feature_flags WHERE flag_key = ?', args: [flag.key] })).rows[0];
    if (!exists) {
      await db.execute({
        sql: `INSERT INTO feature_flags (flag_key, enabled, label, description, category) VALUES (?, ?, ?, ?, ?)`,
        args: [flag.key, flag.enabled, flag.label, flag.description, flag.category]
      });
    }
  }
  console.log('✅ Feature flags seedet');

  console.log('\n🎉 Seed færdig! Demo-login:');
  console.log('   Admin:  admin@grenaaif.dk  / GrenaaIF2026!');
  console.log('   Bruger: mette@test.dk      / Test1234!');
  console.log('   Bruger: lars@test.dk       / Test1234!');
}

module.exports = { seed };
