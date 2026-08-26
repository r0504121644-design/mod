import jwt from 'jsonwebtoken';
import { db } from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'yoetzet-plus-dev-secret-change-in-production';
export const COOKIE_NAME = 'yp_token';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, schoolId: user.school_id, role: user.role },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'לא מחוברת למערכת' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM User WHERE id = ? AND active = 1').get(payload.sub);
    if (!user) return res.status(401).json({ error: 'משתמשת לא נמצאה או מושבתת' });
    // Trust DB as source of truth for school/role, never the client.
    req.user = {
      id: user.id,
      schoolId: user.school_id,
      role: user.role,
      name: user.name,
      email: user.email,
    };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'החיבור פג תוקף, יש להתחבר מחדש' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'אין הרשאה לפעולה זו' });
    }
    next();
  };
}
