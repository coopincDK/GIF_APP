-- Teams
CREATE TABLE IF NOT EXISTS teams (
  team_id TEXT PRIMARY KEY,
  team_name TEXT NOT NULL
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  team_id TEXT REFERENCES teams(team_id),
  profile_picture_url TEXT,
  phone_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Invite tokens
CREATE TABLE IF NOT EXISTS invite_tokens (
  token TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(team_id),
  created_by TEXT REFERENCES users(user_id),
  used_by TEXT REFERENCES users(user_id),
  used_at DATETIME,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  task_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'liga',
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  team_id TEXT REFERENCES teams(team_id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Task Assignments
CREATE TABLE IF NOT EXISTS task_assignments (
  assignment_id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(task_id),
  user_id TEXT REFERENCES users(user_id),
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completion_date DATETIME,
  is_swap_offered INTEGER DEFAULT 0
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  badge_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  type TEXT NOT NULL
);

-- User Badges
CREATE TABLE IF NOT EXISTS user_badges (
  user_badge_id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id),
  badge_id TEXT REFERENCES badges(badge_id),
  date_awarded DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Content (Trænerens Hjørne)
CREATE TABLE IF NOT EXISTS content (
  content_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body_text TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Cup Shifts (Kattegat Cup vagter)
CREATE TABLE IF NOT EXISTS cup_shifts (
  shift_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  shift_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  max_volunteers INTEGER DEFAULT 1,
  icon_type TEXT
);

-- Cup Shift Signups
CREATE TABLE IF NOT EXISTS cup_shift_signups (
  signup_id TEXT PRIMARY KEY,
  shift_id TEXT REFERENCES cup_shifts(shift_id),
  user_id TEXT REFERENCES users(user_id),
  signed_up_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shift_id, user_id)
);

-- App Settings (key/value store til f.eks. cup_mode_override)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
