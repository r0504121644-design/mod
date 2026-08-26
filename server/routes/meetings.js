import express from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES, blockAdminFromClinicalContent, getTeacherClassIds, maskConfidential } from '../middleware/authorize.js';
import { newId } from '../utils/ids.js';
import { logAudit, notify } from '../utils/audit.js';

const router = express.Router();
router.use(requireAuth, blockAdminFromClinicalContent);

const CONFIDENTIAL_FIELDS = ['purpose', 'topics', 'decisions', 'follow_up', 'participants'];

function visibleToTeacher(meeting, user) {
  if (user.role !== ROLES.TEACHER) return true;
  if (!meeting.student_id) return false;
  const classIds = getTeacherClassIds(user.id);
  const student = db.prepare('SELECT class_id FROM Student WHERE id = ?').get(meeting.student_id);
  return student && classIds.includes(student.class_id);
}

router.get('/', (req, res) => {
  const { studentId, caseId, todayOnly } = req.query;
  let sql = `SELECT m.*, s.first_name as student_first_name, s.last_name as student_last_name
             FROM Meeting m LEFT JOIN Student s ON s.id = m.student_id
             WHERE m.school_id = ?`;
  const args = [req.user.schoolId];
  if (studentId) {
    sql += ' AND m.student_id = ?';
    args.push(studentId);
  }
  if (caseId) {
    sql += ' AND m.case_id = ?';
    args.push(caseId);
  }
  if (todayOnly) {
    sql += " AND date(m.meeting_date) = date('now')";
  }
  sql += ' ORDER BY m.meeting_date DESC';
  let rows = db.prepare(sql).all(...args);
  rows = rows.filter((m) => visibleToTeacher(m, req.user));
  if (req.user.role === ROLES.TEACHER) rows = rows.filter((m) => !m.confidential);
  rows = rows.map((m) => maskConfidential(m, req.user, CONFIDENTIAL_FIELDS)).filter(Boolean);
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM Meeting WHERE id = ? AND school_id = ?').get(req.params.id, req.user.schoolId);
  if (!row) return res.status(404).json({ error: 'פגישה לא נמצאה' });
  if (!visibleToTeacher(row, req.user)) return res.status(403).json({ error: 'אין הרשאה לפגישה זו' });
  if (req.user.role === ROLES.TEACHER && row.confidential) return res.status(403).json({ error: 'מידע חסוי' });
  const masked = maskConfidential(row, req.user, CONFIDENTIAL_FIELDS);
  if (!masked) return res.status(403).json({ error: 'מידע חסוי' });
  res.json(masked);
});

router.post('/', requireRole(ROLES.COUNSELOR, ROLES.TEACHER), (req, res) => {
  const { studentId, caseId, type, meetingDate, participants, purpose, topics, decisions, followUp, confidential } = req.body || {};
  if (!type || !meetingDate) return res.status(400).json({ error: 'נא לבחור סוג פגישה ותאריך' });

  if (req.user.role === ROLES.TEACHER) {
    if (type !== 'teacher') return res.status(403).json({ error: 'מחנכת יכולה לפתוח פגישת מחנכת בלבד' });
    if (confidential) return res.status(403).json({ error: 'מחנכת לא יכולה לסמן פגישה כחסויה' });
    if (studentId) {
      const classIds = getTeacherClassIds(req.user.id);
      const student = db.prepare('SELECT class_id FROM Student WHERE id = ? AND school_id = ?').get(studentId, req.user.schoolId);
      if (!student || !classIds.includes(student.class_id)) return res.status(403).json({ error: 'אין הרשאה לתלמידה זו' });
    }
  }

  const id = newId('meet');
  db.prepare(
    `INSERT INTO Meeting (id, school_id, student_id, case_id, type, meeting_date, participants, purpose, topics, decisions, follow_up, confidential, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, req.user.schoolId, studentId || null, caseId || null, type, meetingDate,
    participants || null, purpose || null, topics || null, decisions || null, followUp || null,
    confidential ? 1 : 0, req.user.id
  );
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'create', entityType: 'Meeting', entityId: id });
  res.status(201).json(db.prepare('SELECT * FROM Meeting WHERE id = ?').get(id));
});

router.put('/:id', requireRole(ROLES.COUNSELOR), (req, res) => {
  const row = db.prepare('SELECT * FROM Meeting WHERE id = ? AND school_id = ?').get(req.params.id, req.user.schoolId);
  if (!row) return res.status(404).json({ error: 'פגישה לא נמצאה' });
  const { participants, purpose, topics, decisions, followUp, confidential, meetingDate } = req.body || {};
  db.prepare(
    `UPDATE Meeting SET meeting_date = ?, participants = ?, purpose = ?, topics = ?, decisions = ?, follow_up = ?, confidential = ? WHERE id = ?`
  ).run(
    meetingDate ?? row.meeting_date,
    participants ?? row.participants,
    purpose ?? row.purpose,
    topics ?? row.topics,
    decisions ?? row.decisions,
    followUp ?? row.follow_up,
    confidential === undefined ? row.confidential : (confidential ? 1 : 0),
    row.id
  );
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'update', entityType: 'Meeting', entityId: row.id });
  res.json(db.prepare('SELECT * FROM Meeting WHERE id = ?').get(row.id));
});

export default router;
