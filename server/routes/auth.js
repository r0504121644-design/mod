import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken, COOKIE_NAME, requireAuth } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'נא להזין אימייל וסיסמה' });
  }
  const user = db.prepare('SELECT * FROM User WHERE email = ? AND active = 1').get(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
  }
  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 12 * 60 * 60 * 1000,
  });
  logAudit({ schoolId: user.school_id, userId: user.id, action: 'login', entityType: 'User', entityId: user.id });
  const school = db.prepare('SELECT id, name, is_demo FROM School WHERE id = ?').get(user.school_id);
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, schoolId: user.school_id },
    school,
  });
});

router.post('/logout', requireAuth, (req, res) => {
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'logout', entityType: 'User', entityId: req.user.id });
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const school = db.prepare('SELECT id, name, is_demo FROM School WHERE id = ?').get(req.user.schoolId);
  res.json({ user: req.user, school });
});

export default router;
