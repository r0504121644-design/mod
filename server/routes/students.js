import express from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { blockAdminFromClinicalContent, getTeacherClassIds, ROLES } from '../middleware/authorize.js';
import { newId } from '../utils/ids.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();
router.use(requireAuth, blockAdminFromClinicalContent);

function scopeClause(user) {
  if (user.role === ROLES.TEACHER) {
    const classIds = getTeacherClassIds(user.id);
    if (classIds.length === 0) return { clause: '1=0', params: [] };
    return { clause: `class_id IN (${classIds.map(() => '?').join(',')})`, params: classIds };
  }
  return { clause: '1=1', params: [] };
}

router.get('/', (req, res) => {
  const { search, classId, status } = req.query;
  const { clause, params } = scopeClause(req.user);
  let sql = `SELECT s.*, c.name as class_name FROM Student s LEFT JOIN Class c ON c.id = s.class_id
             WHERE s.school_id = ? AND ${clause.replace(/class_id/g, 's.class_id')}`;
  const args = [req.user.schoolId, ...params];
  if (status) {
    sql += ' AND s.status = ?';
    args.push(status);
  } else {
    sql += " AND s.status = 'active'";
  }
  if (classId) {
    sql += ' AND s.class_id = ?';
    args.push(classId);
  }
  if (search) {
    sql += ' AND (s.first_name LIKE ? OR s.last_name LIKE ?)';
    args.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY s.first_name';
  const rows = db.prepare(sql).all(...args);
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const student = db.prepare('SELECT s.*, c.name as class_name FROM Student s LEFT JOIN Class c ON c.id = s.class_id WHERE s.id = ? AND s.school_id = ?').get(req.params.id, req.user.schoolId);
  if (!student) return res.status(404).json({ error: 'תלמידה לא נמצאה' });
  if (req.user.role === ROLES.TEACHER) {
    const classIds = getTeacherClassIds(req.user.id);
    if (!classIds.includes(student.class_id)) return res.status(403).json({ error: 'אין הרשאה לתלמידה זו' });
  }
  res.json(student);
});

router.post('/', requireRole(ROLES.COUNSELOR), (req, res) => {
  const { firstName, lastName, classId, gender, birthDate, strengthsResources } = req.body || {};
  if (!firstName || !lastName) return res.status(400).json({ error: 'נא להזין שם פרטי ושם משפחה' });
  const id = newId('stu');
  db.prepare(
    `INSERT INTO Student (id, school_id, class_id, first_name, last_name, gender, birth_date, strengths_resources)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.schoolId, classId || null, firstName, lastName, gender || null, birthDate || null, strengthsResources || null);
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'create', entityType: 'Student', entityId: id });
  res.status(201).json(db.prepare('SELECT * FROM Student WHERE id = ?').get(id));
});

router.put('/:id', requireRole(ROLES.COUNSELOR), (req, res) => {
  const student = db.prepare('SELECT * FROM Student WHERE id = ? AND school_id = ?').get(req.params.id, req.user.schoolId);
  if (!student) return res.status(404).json({ error: 'תלמידה לא נמצאה' });
  const { firstName, lastName, classId, gender, birthDate, strengthsResources } = req.body || {};
  db.prepare(
    `UPDATE Student SET first_name = ?, last_name = ?, class_id = ?, gender = ?, birth_date = ?, strengths_resources = ? WHERE id = ?`
  ).run(
    firstName ?? student.first_name,
    lastName ?? student.last_name,
    classId ?? student.class_id,
    gender ?? student.gender,
    birthDate ?? student.birth_date,
    strengthsResources ?? student.strengths_resources,
    student.id
  );
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'update', entityType: 'Student', entityId: student.id });
  res.json(db.prepare('SELECT * FROM Student WHERE id = ?').get(student.id));
});

router.post('/:id/archive', requireRole(ROLES.COUNSELOR), (req, res) => {
  const student = db.prepare('SELECT * FROM Student WHERE id = ? AND school_id = ?').get(req.params.id, req.user.schoolId);
  if (!student) return res.status(404).json({ error: 'תלמידה לא נמצאה' });
  const newStatus = student.status === 'archived' ? 'active' : 'archived';
  db.prepare('UPDATE Student SET status = ?, archived_at = ? WHERE id = ?').run(
    newStatus,
    newStatus === 'archived' ? new Date().toISOString() : null,
    student.id
  );
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: newStatus === 'archived' ? 'archive' : 'unarchive', entityType: 'Student', entityId: student.id });
  res.json(db.prepare('SELECT * FROM Student WHERE id = ?').get(student.id));
});

export default router;
