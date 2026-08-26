import express from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES, blockAdminFromClinicalContent, getTeacherClassIds } from '../middleware/authorize.js';
import { newId } from '../utils/ids.js';
import { logAudit, notify } from '../utils/audit.js';

const router = express.Router();
router.use(requireAuth, blockAdminFromClinicalContent);

router.get('/', (req, res) => {
  let sql = `SELECT r.*, s.first_name as student_first_name, s.last_name as student_last_name, u.name as referred_by_name
             FROM TeacherReferral r
             JOIN Student s ON s.id = r.student_id
             LEFT JOIN User u ON u.id = r.referred_by
             WHERE r.school_id = ?`;
  const args = [req.user.schoolId];
  if (req.user.role === ROLES.TEACHER) {
    sql += ' AND r.referred_by = ?';
    args.push(req.user.id);
  }
  if (req.query.status) {
    sql += ' AND r.status = ?';
    args.push(req.query.status);
  }
  sql += ' ORDER BY r.created_at DESC';
  res.json(db.prepare(sql).all(...args));
});

router.post('/', requireRole(ROLES.TEACHER), (req, res) => {
  const { studentId, reason, description } = req.body || {};
  if (!studentId || !reason) return res.status(400).json({ error: 'נא לבחור תלמידה ולהזין סיבה' });
  const classIds = getTeacherClassIds(req.user.id);
  const student = db.prepare('SELECT * FROM Student WHERE id = ? AND school_id = ?').get(studentId, req.user.schoolId);
  if (!student || !classIds.includes(student.class_id)) return res.status(403).json({ error: 'ניתן לפנות רק עבור תלמידה בכיתתך' });
  const id = newId('ref');
  db.prepare(
    `INSERT INTO TeacherReferral (id, school_id, student_id, class_id, referred_by, reason, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.schoolId, studentId, student.class_id, req.user.id, reason, description || null);

  const counselors = db.prepare("SELECT id FROM User WHERE school_id = ? AND role = 'counselor' AND active = 1").all(req.user.schoolId);
  for (const c of counselors) {
    notify({
      schoolId: req.user.schoolId,
      userId: c.id,
      type: 'new_referral',
      message: `פנייה חדשה ממחנכת עבור ${student.first_name} ${student.last_name}`,
      entityType: 'TeacherReferral',
      entityId: id,
    });
  }
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'create', entityType: 'TeacherReferral', entityId: id });
  res.status(201).json(db.prepare('SELECT * FROM TeacherReferral WHERE id = ?').get(id));
});

router.put('/:id', requireRole(ROLES.COUNSELOR), (req, res) => {
  const row = db.prepare('SELECT * FROM TeacherReferral WHERE id = ? AND school_id = ?').get(req.params.id, req.user.schoolId);
  if (!row) return res.status(404).json({ error: 'פנייה לא נמצאה' });
  const { status } = req.body || {};
  db.prepare("UPDATE TeacherReferral SET status = ?, handled_at = CASE WHEN ? = 'handled' THEN datetime('now') ELSE handled_at END WHERE id = ?").run(
    status ?? row.status, status ?? row.status, row.id
  );
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'update', entityType: 'TeacherReferral', entityId: row.id });
  res.json(db.prepare('SELECT * FROM TeacherReferral WHERE id = ?').get(row.id));
});

export default router;
