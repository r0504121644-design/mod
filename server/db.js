import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'yoetzet.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS School (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES School(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('counselor','teacher','principal','admin')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Class (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES School(id),
  name TEXT NOT NULL,
  grade TEXT,
  homeroom_teacher_id TEXT REFERENCES User(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Student (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES School(id),
  class_id TEXT REFERENCES Class(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT,
  birth_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
  strengths_resources TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS CounselingCase (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES School(id),
  student_id TEXT NOT NULL REFERENCES Student(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','closed')),
  summary TEXT,
  confidential INTEGER NOT NULL DEFAULT 1,
  opened_by TEXT NOT NULL REFERENCES User(id),
  opened_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS Meeting (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES School(id),
  student_id TEXT REFERENCES Student(id),
  case_id TEXT REFERENCES CounselingCase(id),
  type TEXT NOT NULL CHECK(type IN ('student','parents','teacher','staff','management','professional')),
  meeting_date TEXT NOT NULL,
  participants TEXT,
  purpose TEXT,
  topics TEXT,
  decisions TEXT,
  follow_up TEXT,
  confidential INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL REFERENCES User(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Task (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES School(id),
  title TEXT NOT NULL,
  description TEXT,
  assignee_id TEXT REFERENCES User(id),
  due_date TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done')),
  student_id TEXT REFERENCES Student(id),
  case_id TEXT REFERENCES CounselingCase(id),
  meeting_id TEXT REFERENCES Meeting(id),
  created_by TEXT NOT NULL REFERENCES User(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS Observation (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES School(id),
  student_id TEXT NOT NULL REFERENCES Student(id),
  case_id TEXT REFERENCES CounselingCase(id),
  observation_date TEXT NOT NULL,
  content TEXT NOT NULL,
  confidential INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL REFERENCES User(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS TeacherReferral (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES School(id),
  student_id TEXT NOT NULL REFERENCES Student(id),
  class_id TEXT REFERENCES Class(id),
  referred_by TEXT NOT NULL REFERENCES User(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','in_review','handled')),
  case_id TEXT REFERENCES CounselingCase(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  handled_at TEXT
);

CREATE TABLE IF NOT EXISTS InterventionPlan (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES School(id),
  student_id TEXT NOT NULL REFERENCES Student(id),
  case_id TEXT REFERENCES CounselingCase(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed')),
  start_date TEXT,
  end_date TEXT,
  created_by TEXT NOT NULL REFERENCES User(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS InterventionGoal (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES School(id),
  plan_id TEXT NOT NULL REFERENCES InterventionPlan(id),
  student_id TEXT NOT NULL REFERENCES Student(id),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','achieved')),
  target_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Attachment (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES School(id),
  student_id TEXT REFERENCES Student(id),
  case_id TEXT REFERENCES CounselingCase(id),
  meeting_id TEXT REFERENCES Meeting(id),
  title TEXT NOT NULL,
  note TEXT,
  uploaded_by TEXT NOT NULL REFERENCES User(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Notification (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES School(id),
  user_id TEXT NOT NULL REFERENCES User(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS AuditLog (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES School(id),
  user_id TEXT REFERENCES User(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_school ON User(school_id);
CREATE INDEX IF NOT EXISTS idx_student_school ON Student(school_id);
CREATE INDEX IF NOT EXISTS idx_student_class ON Student(class_id);
CREATE INDEX IF NOT EXISTS idx_case_student ON CounselingCase(student_id);
CREATE INDEX IF NOT EXISTS idx_meeting_student ON Meeting(student_id);
CREATE INDEX IF NOT EXISTS idx_task_school ON Task(school_id);
CREATE INDEX IF NOT EXISTS idx_task_assignee ON Task(assignee_id);
CREATE INDEX IF NOT EXISTS idx_observation_student ON Observation(student_id);
CREATE INDEX IF NOT EXISTS idx_referral_student ON TeacherReferral(student_id);
CREATE INDEX IF NOT EXISTS idx_plan_student ON InterventionPlan(student_id);
CREATE INDEX IF NOT EXISTS idx_goal_plan ON InterventionGoal(plan_id);
CREATE INDEX IF NOT EXISTS idx_notification_user ON Notification(user_id);
`);

export default db;
