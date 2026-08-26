import express from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES, blockAdminFromClinicalContent } from '../middleware/authorize.js';
import { newId } from '../utils/ids.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();
router.use(requireAuth, blockAdminFromClinicalContent);

router.get('/', (req, res) => {
  const { studentId, caseId, meetingId } = req.query;
  let sql = 'SELECT a.*, u.name as uploaded_by_name FROM Attachment a LEFT JOIN User u ON u.id = a.uploaded_by WHERE a.school_id = ?';
  const args = [req.user.schoolId];
  if (studentId) {
    sql += ' AND a.student_id = ?';
    args.push(studentId);
  }
  if (caseId) {
    sql += ' AND a.case_id = ?';
    args.push(caseId);
  }
  if (meetingId) {
    sql += ' AND a.meeting_id = ?';
    args.push(meetingId);
  }
  sql += ' ORDER BY a.created_at DESC';
  if (req.user.role === ROLES.TEACHER) return res.json([]);
  res.json(db.prepare(sql).all(...args));
});

router.post('/', requireRole(ROLES.COUNSELOR), (req, res) => {
  const { studentId, caseId, meetingId, title, note } = req.body || {};
  if (!title) return res.status(400).json({ error: 'נא להזין כותרת למסמך' });
  const id = newId('att');
  db.prepare(
    `INSERT INTO Attachment (id, school_id, student_id, case_id, meeting_id, title, note, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.schoolId, studentId || null, caseId || null, meetingId || null, title, note || null, req.user.id);
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'create', entityType: 'Attachment', entityId: id });
  res.status(201).json(db.prepare('SELECT * FROM Attachment WHERE id = ?').get(id));
});

export default router;
