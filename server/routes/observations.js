import express from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES, blockAdminFromClinicalContent, getTeacherClassIds, maskConfidential } from '../middleware/authorize.js';
import { newId } from '../utils/ids.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();
router.use(requireAuth, blockAdminFromClinicalContent);

router.get('/', (req, res) => {
  const { studentId, caseId } = req.query;
  let sql = 'SELECT * FROM Observation WHERE school_id = ?';
  const args = [req.user.schoolId];
  if (studentId) {
    sql += ' AND student_id = ?';
    args.push(studentId);
  }
  if (caseId) {
    sql += ' AND case_id = ?';
    args.push(caseId);
  }
  sql += ' ORDER BY observation_date DESC';
  let rows = db.prepare(sql).all(...args);
  if (req.user.role === ROLES.TEACHER) {
    const classIds = getTeacherClassIds(req.user.id);
    rows = rows.filter((o) => {
      const student = db.prepare('SELECT class_id FROM Student WHERE id = ?').get(o.student_id);
      return student && classIds.includes(student.class_id);
    });
  }
  rows = rows.map((o) => maskConfidential(o, req.user, ['content'])).filter(Boolean);
  res.json(rows);
});

router.post('/', requireRole(ROLES.COUNSELOR), (req, res) => {
  const { studentId, caseId, observationDate, content, confidential } = req.body || {};
  if (!studentId || !content || !observationDate) return res.status(400).json({ error: 'נא לבחור תלמידה, תאריך ותוכן' });
  const student = db.prepare('SELECT * FROM Student WHERE id = ? AND school_id = ?').get(studentId, req.user.schoolId);
  if (!student) return res.status(404).json({ error: 'תלמידה לא נמצאה' });
  const id = newId('obs');
  db.prepare(
    `INSERT INTO Observation (id, school_id, student_id, case_id, observation_date, content, confidential, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.schoolId, studentId, caseId || null, observationDate, content, confidential === false ? 0 : 1, req.user.id);
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'create', entityType: 'Observation', entityId: id });
  res.status(201).json(db.prepare('SELECT * FROM Observation WHERE id = ?').get(id));
});

export default router;
