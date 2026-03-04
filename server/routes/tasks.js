const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

async function awardBadgeForTask(db, userId, taskTitle) {
  const badgeMap = { 'Tøjvask': 'Hold-Helt', 'Frugt med': 'Frugt-Helt', 'Kage med': 'Kage-Helt' };
  const badgeName = badgeMap[taskTitle] || 'Hold-Helt';
  const badge = (await db.execute({ sql: 'SELECT * FROM badges WHERE name = ?', args: [badgeName] })).rows[0];
  if (!badge) return null;
  const has = (await db.execute({ sql: 'SELECT 1 FROM user_badges WHERE user_id = ? AND badge_id = ?', args: [userId, badge.badge_id] })).rows[0];
  if (!has) {
    await db.execute({ sql: 'INSERT INTO user_badges (user_badge_id, user_id, badge_id) VALUES (?, ?, ?)', args: [uuidv4(), userId, badge.badge_id] });
    return badge;
  }
  return null;
}

// GET /api/tasks/my — opgaver tildelt til den loggede bruger + åbne swap-tilbud
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    // Mine egne opgaver
    const mine = (await db.execute({
      sql: `SELECT t.*, ta.user_id as assigned_to, ta.assignment_id, ta.is_swap_offered,
              u.name as assigned_to_name, ta.completion_date
            FROM tasks t
            JOIN task_assignments ta ON t.task_id = ta.task_id
            JOIN users u ON ta.user_id = u.user_id
            WHERE t.team_id = ? AND ta.user_id = ? AND ta.completion_date IS NULL
            ORDER BY t.created_at DESC`,
      args: [req.user.team_id, req.user.user_id]
    })).rows;
    // Åbne swap-tilbud fra andre (som jeg kan overtage)
    const swaps = (await db.execute({
      sql: `SELECT t.*, ta.user_id as assigned_to, ta.assignment_id, ta.is_swap_offered,
              u.name as assigned_to_name, ta.completion_date
            FROM tasks t
            JOIN task_assignments ta ON t.task_id = ta.task_id
            JOIN users u ON ta.user_id = u.user_id
            WHERE t.team_id = ? AND ta.is_swap_offered = 1
              AND ta.user_id != ? AND ta.completion_date IS NULL`,
      args: [req.user.team_id, req.user.user_id]
    })).rows;
    // Kombiner og deduplikér
    const seen = new Set();
    const all = [...mine, ...swaps].filter(t => {
      if (seen.has(t.task_id)) return false;
      seen.add(t.task_id);
      return true;
    });
    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// GET /api/tasks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const tasks = (await db.execute({
      sql: `SELECT t.*, ta.user_id as assigned_to, ta.assignment_id, ta.is_swap_offered,
              u.name as assigned_to_name, ta.completion_date
            FROM tasks t
            LEFT JOIN task_assignments ta ON t.task_id = ta.task_id AND ta.completion_date IS NULL
            LEFT JOIN users u ON ta.user_id = u.user_id
            WHERE t.team_id = ? ORDER BY t.created_at DESC`,
      args: [req.user.team_id]
    })).rows;
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// POST /api/tasks  (admin only)
router.post('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { title, description, type, due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'Titel er påkrævet' });
    const db = getDb();
    const taskId = uuidv4();
    await db.execute({
      sql: `INSERT INTO tasks (task_id, title, description, type, due_date, status, team_id) VALUES (?, ?, ?, ?, ?, 'open', ?)`,
      args: [taskId, title, description || null, type || 'liga', due_date || null, req.user.team_id]
    });
    const task = (await db.execute({ sql: 'SELECT * FROM tasks WHERE task_id = ?', args: [taskId] })).rows[0];
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// DELETE /api/tasks/:id  (admin only)
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM task_assignments WHERE task_id = ?', args: [req.params.id] });
    await db.execute({ sql: 'DELETE FROM tasks WHERE task_id = ?', args: [req.params.id] });
    res.json({ message: 'Opgave slettet' });
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// POST /api/tasks/:id/complete
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const assignment = (await db.execute({
      sql: `SELECT ta.*, t.title FROM task_assignments ta
            JOIN tasks t ON ta.task_id = t.task_id
            WHERE ta.task_id = ? AND ta.user_id = ? AND ta.completion_date IS NULL`,
      args: [req.params.id, req.user.user_id]
    })).rows[0];

    if (!assignment) return res.status(404).json({ error: 'Opgave ikke fundet eller ikke tildelt dig' });

    await db.execute({ sql: `UPDATE task_assignments SET completion_date = datetime('now') WHERE assignment_id = ?`, args: [assignment.assignment_id] });
    await db.execute({ sql: `UPDATE tasks SET status = 'completed' WHERE task_id = ?`, args: [req.params.id] });

    const newBadge = await awardBadgeForTask(db, req.user.user_id, assignment.title);
    res.json({ message: 'Opgave fuldført! 🎉', new_badge: newBadge });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// POST /api/tasks/spin  (admin only)
router.post('/spin', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const openTasks = (await db.execute({
      sql: `SELECT t.* FROM tasks t
            LEFT JOIN task_assignments ta ON t.task_id = ta.task_id AND ta.completion_date IS NULL
            WHERE t.team_id = ? AND t.type = 'liga' AND t.status = 'open' AND ta.assignment_id IS NULL`,
      args: [req.user.team_id]
    })).rows;

    if (openTasks.length === 0) return res.status(400).json({ error: 'Ingen åbne opgaver at fordele' });

    const users = (await db.execute({
      sql: `SELECT u.user_id, u.name, COUNT(ta.assignment_id) as task_count
            FROM users u
            LEFT JOIN task_assignments ta ON u.user_id = ta.user_id AND ta.completion_date IS NULL
            WHERE u.team_id = ? AND u.role = 'user'
            GROUP BY u.user_id ORDER BY task_count ASC`,
      args: [req.user.team_id]
    })).rows;

    if (users.length === 0) return res.status(400).json({ error: 'Ingen brugere på holdet endnu' });

    const results = [];
    const usedIds = new Set();

    for (const task of openTasks.slice(0, 3)) {
      const available = users.filter(u => !usedIds.has(u.user_id));
      if (available.length === 0) break;
      const pool = available.slice(0, Math.max(1, Math.ceil(available.length / 2)));
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      usedIds.add(chosen.user_id);
      results.push({
        task: { task_id: task.task_id, title: task.title, description: task.description },
        user: { user_id: chosen.user_id, name: chosen.name },
      });
    }

    res.json({ results, message: 'Hjulet har talt! 🎡' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// POST /api/tasks/spin/confirm  (admin only)
router.post('/spin/confirm', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { assignments } = req.body;
    if (!assignments || !Array.isArray(assignments))
      return res.status(400).json({ error: 'assignments array påkrævet' });

    const db = getDb();
    for (const assignment of assignments) {
      let { task_id, user_id, userId, taskType } = assignment;
      // Normaliser user_id
      user_id = user_id || userId;
      if (!user_id) continue;

      // Normaliser taskType: 'laundry' -> 'tøjvask'
      const typeMap = { laundry: 'tøjvask', frugt: 'frugt', kage: 'kage' };
      const type = typeMap[taskType] || taskType || 'tøjvask';

      // Hent brugerens team_id
      const userRow = (await db.execute({
        sql: 'SELECT team_id FROM users WHERE user_id = ?',
        args: [user_id]
      })).rows[0];
      const team_id = userRow?.team_id || null;

      // Hvis ingen task_id: opret altid en ny opgave per spin (undgå konflikter)
      if (!task_id) {
        task_id = uuidv4();
        const weekLabel = new Date().toISOString().slice(0, 10);
        await db.execute({
          sql: `INSERT INTO tasks (task_id, title, description, type, status, team_id, due_date) VALUES (?, ?, ?, ?, 'assigned', ?, ?)`,
          args: [task_id, 'Tøjvask', 'Vask og tør trøjer efter kamp', type, team_id, weekLabel]
        });
      }

      // INSERT OR IGNORE undgår crash ved dubletter
      await db.execute({
        sql: 'INSERT OR IGNORE INTO task_assignments (assignment_id, task_id, user_id) VALUES (?, ?, ?)',
        args: [uuidv4(), task_id, user_id]
      });
    }
    res.json({ message: 'Opgaver fordelt! 🎉', count: assignments.length });
  } catch (err) {
    console.error('spin/confirm fejl:', err);
    res.status(500).json({ error: err.message || 'Serverfejl' });
  }
});

// POST /api/tasks/:id/offer-swap
router.post('/:id/offer-swap', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const assignment = (await db.execute({
      sql: 'SELECT * FROM task_assignments WHERE task_id = ? AND user_id = ? AND completion_date IS NULL',
      args: [req.params.id, req.user.user_id]
    })).rows[0];
    if (!assignment) return res.status(404).json({ error: 'Opgave ikke fundet' });
    await db.execute({ sql: 'UPDATE task_assignments SET is_swap_offered = 1 WHERE assignment_id = ?', args: [assignment.assignment_id] });
    res.json({ message: 'Swap tilbudt! Andre kan nu overtage opgaven 🔄' });
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// POST /api/tasks/:id/accept-swap
router.post('/:id/accept-swap', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const assignment = (await db.execute({
      sql: 'SELECT * FROM task_assignments WHERE task_id = ? AND is_swap_offered = 1 AND completion_date IS NULL',
      args: [req.params.id]
    })).rows[0];
    if (!assignment) return res.status(404).json({ error: 'Ingen swap tilgængelig' });
    if (assignment.user_id === req.user.user_id) return res.status(400).json({ error: 'Du kan ikke overtage din egen opgave' });
    await db.execute({ sql: 'UPDATE task_assignments SET user_id = ?, is_swap_offered = 0 WHERE assignment_id = ?', args: [req.user.user_id, assignment.assignment_id] });
    res.json({ message: 'Du har overtaget opgaven! 💪' });
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// GET /api/tasks/swaps/open
router.get('/swaps/open', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const swaps = (await db.execute({
      sql: `SELECT t.*, ta.assignment_id, ta.user_id as current_user_id, u.name as current_user_name
            FROM tasks t
            JOIN task_assignments ta ON t.task_id = ta.task_id
            JOIN users u ON ta.user_id = u.user_id
            WHERE t.team_id = ? AND ta.is_swap_offered = 1 AND ta.completion_date IS NULL`,
      args: [req.user.team_id]
    })).rows;
    res.json(swaps);
  } catch (err) {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// GET /api/tasks/laundry-counts?teamId=X
// Returnerer antal tøjvaske per spiller — bruges til weighted spin på frontend.
//
// Weighted spin logik (frontend bruger spin_weight som segment-størrelse på hjulet):
//   0 vaske  → vægt 10  (størst segment = størst chance)
//   1 vask   → vægt 7
//   2 vaske  → vægt 4
//   3+ vaske → vægt 1   (mindst segment = mindst chance)
router.get('/laundry-counts', authenticateToken, async (req, res) => {
  try {
    const teamId = req.query.teamId || req.user.team_id;
    const db = getDb();

    const rows = (await db.execute({
      sql: `SELECT u.user_id, u.name,
                   COUNT(ta.assignment_id) as laundry_count
            FROM users u
            LEFT JOIN task_assignments ta ON u.user_id = ta.user_id
            LEFT JOIN tasks t ON ta.task_id = t.task_id
                              AND (t.title LIKE '%tøjvask%' OR t.type = 'tøjvask')
            WHERE u.team_id = ? AND u.role = 'user'
            GROUP BY u.user_id, u.name
            ORDER BY laundry_count ASC, u.name ASC`,
      args: [teamId],
    })).rows;

    const result = rows.map(row => {
      const count = row.laundry_count ?? 0;
      let spin_weight;
      if      (count === 0) spin_weight = 10;
      else if (count === 1) spin_weight = 7;
      else if (count === 2) spin_weight = 4;
      else                  spin_weight = 1;

      return {
        user_id:      row.user_id,
        name:         row.name,
        laundry_count: count,
        spin_weight,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// POST /api/tasks/spin/save  (alias for /spin/confirm)
router.post('/spin/save', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { assignments } = req.body;
    if (!assignments || !Array.isArray(assignments))
      return res.status(400).json({ error: 'assignments array p\u00e5kr\u00e6vet' });
    const db = getDb();
    for (const { userId, user_id, taskType } of assignments) {
      const uid = userId || user_id;
      // Find eller opret t\u00f8jvask-opgave
      let task = (await db.execute({
        sql: `SELECT task_id FROM tasks WHERE team_id = ? AND title LIKE '%\u00f8jvask%' AND status = 'open' LIMIT 1`,
        args: [req.user.team_id]
      })).rows[0];
      if (!task) {
        const tid = uuidv4();
        await db.execute({
          sql: `INSERT INTO tasks (task_id, title, description, type, status, team_id) VALUES (?, 'T\u00f8jvask', 'Vask holdets tr\u00f8jer', 'liga', 'open', ?)`,
          args: [tid, req.user.team_id]
        });
        task = { task_id: tid };
      }
      await db.execute({ sql: 'INSERT INTO task_assignments (assignment_id, task_id, user_id) VALUES (?, ?, ?)', args: [uuidv4(), task.task_id, uid] });
      await db.execute({ sql: `UPDATE tasks SET status = 'assigned' WHERE task_id = ?`, args: [task.task_id] });
    }
    res.json({ message: 'T\u00f8jvask gemt! \u2705' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

module.exports = router;
