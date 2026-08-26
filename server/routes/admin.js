import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../middleware/authorize.js';
import { newId } from '../utils/ids.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();
router.use(requireAuth);

// Lightweight user directory (name/role/id only) — needed across roles to
// populate assignee/participant pickers. No email/password exposed here.
router.get('/users/directory', (req, res) => {
  const rows = db
    .prepare("SELECT id, name, role FROM User WHERE school_id = ? AND active = 1 ORDER BY name")
    .all(req.user.schoolId);
  res.json(rows);
});

router.use(requireRole(ROLES.ADMIN));

router.get('/users', (req, res) => {
  const rows = db
    .prepare('SELECT id, name, email, role, active, created_at FROM User WHERE school_id = ? ORDER BY created_at')
    .all(req.user.schoolId);
  res.json(rows);
});

router.post('/users', (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'נא למלא את כל השדות' });
  if (!Object.values(ROLES).includes(role)) return res.status(400).json({ error: 'תפקיד לא חוקי' });
  const existing = db.prepare('SELECT id FROM User WHERE email = ?').get(email.trim().toLowerCase());
  if (existing) return res.status(409).json({ error: 'כתובת אימייל כבר קיימת במערכת' });
  const id = newId('user');
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO User (id, school_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)').run(
    id, req.user.schoolId, name, email.trim().toLowerCase(), hash, role
  );
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'create', entityType: 'User', entityId: id });
  res.status(201).json({ id, name, email, role, active: 1 });
});

router.put('/users/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM User WHERE id = ? AND school_id = ?').get(req.params.id, req.user.schoolId);
  if (!user) return res.status(404).json({ error: 'משתמשת לא נמצאה' });
  const { name, role, active } = req.body || {};
  db.prepare('UPDATE User SET name = ?, role = ?, active = ? WHERE id = ?').run(
    name ?? user.name,
    role ?? user.role,
    active === undefined ? user.active : (active ? 1 : 0),
    user.id
  );
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'update', entityType: 'User', entityId: user.id });
  res.json(db.prepare('SELECT id, name, email, role, active FROM User WHERE id = ?').get(user.id));
});

router.get('/audit-log', (req, res) => {
  const rows = db
    .prepare(`SELECT a.*, u.name as user_name FROM AuditLog a LEFT JOIN User u ON u.id = a.user_id
              WHERE a.school_id = ? ORDER BY a.created_at DESC LIMIT 200`)
    .all(req.user.schoolId);
  res.json(rows);
});

export default router;
