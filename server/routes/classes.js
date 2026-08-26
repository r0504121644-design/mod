import express from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES, getTeacherClassIds } from '../middleware/authorize.js';
import { newId } from '../utils/ids.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  let sql = `SELECT cl.*, u.name as homeroom_teacher_name,
             (SELECT COUNT(*) FROM Student s WHERE s.class_id = cl.id AND s.status = 'active') as student_count
             FROM Class cl LEFT JOIN User u ON u.id = cl.homeroom_teacher_id
             WHERE cl.school_id = ?`;
  const args = [req.user.schoolId];
  if (req.user.role === ROLES.TEACHER) {
    const ids = getTeacherClassIds(req.user.id);
    if (ids.length === 0) return res.json([]);
    sql += ` AND cl.id IN (${ids.map(() => '?').join(',')})`;
    args.push(...ids);
  }
  sql += ' ORDER BY cl.name';
  res.json(db.prepare(sql).all(...args));
});

router.post('/', requireRole(ROLES.ADMIN, ROLES.COUNSELOR), (req, res) => {
  const { name, grade, homeroomTeacherId } = req.body || {};
  if (!name) return res.status(400).json({ error: 'נא להזין שם כיתה' });
  const id = newId('cls');
  db.prepare('INSERT INTO Class (id, school_id, name, grade, homeroom_teacher_id) VALUES (?, ?, ?, ?, ?)').run(
    id, req.user.schoolId, name, grade || null, homeroomTeacherId || null
  );
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'create', entityType: 'Class', entityId: id });
  res.status(201).json(db.prepare('SELECT * FROM Class WHERE id = ?').get(id));
});

router.put('/:id', requireRole(ROLES.ADMIN, ROLES.COUNSELOR), (req, res) => {
  const cls = db.prepare('SELECT * FROM Class WHERE id = ? AND school_id = ?').get(req.params.id, req.user.schoolId);
  if (!cls) return res.status(404).json({ error: 'כיתה לא נמצאה' });
  const { name, grade, homeroomTeacherId } = req.body || {};
  db.prepare('UPDATE Class SET name = ?, grade = ?, homeroom_teacher_id = ? WHERE id = ?').run(
    name ?? cls.name, grade ?? cls.grade, homeroomTeacherId ?? cls.homeroom_teacher_id, cls.id
  );
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'update', entityType: 'Class', entityId: cls.id });
  res.json(db.prepare('SELECT * FROM Class WHERE id = ?').get(cls.id));
});

export default router;
