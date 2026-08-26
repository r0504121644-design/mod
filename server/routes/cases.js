import express from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES, maskCaseSummary } from '../middleware/authorize.js';
import { newId } from '../utils/ids.js';
import { logAudit, notify } from '../utils/audit.js';

const router = express.Router();
router.use(requireAuth, requireRole(ROLES.COUNSELOR, ROLES.PRINCIPAL));

router.get('/', (req, res) => {
  const { studentId, status } = req.query;
  let sql = 'SELECT * FROM CounselingCase WHERE school_id = ?';
  const args = [req.user.schoolId];
  if (studentId) {
    sql += ' AND student_id = ?';
    args.push(studentId);
  }
  if (status) {
    sql += ' AND status = ?';
    args.push(status);
  }
  sql += ' ORDER BY opened_at DESC';
  const rows = db.prepare(sql).all(...args).map((r) => maskCaseSummary(r, req.user));
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM CounselingCase WHERE id = ? AND school_id = ?').get(req.params.id, req.user.schoolId);
  if (!row) return res.status(404).json({ error: 'תיק לא נמצא' });
  res.json(maskCaseSummary(row, req.user));
});

router.post('/', requireRole(ROLES.COUNSELOR), (req, res) => {
  const { studentId, title, summary, confidential, referralId } = req.body || {};
  if (!studentId || !title) return res.status(400).json({ error: 'נא לבחור תלמידה ולהזין כותרת' });
  const student = db.prepare('SELECT * FROM Student WHERE id = ? AND school_id = ?').get(studentId, req.user.schoolId);
  if (!student) return res.status(404).json({ error: 'תלמידה לא נמצאה' });
  const id = newId('case');
  db.prepare(
    `INSERT INTO CounselingCase (id, school_id, student_id, title, summary, confidential, opened_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.schoolId, studentId, title, summary || null, confidential === false ? 0 : 1, req.user.id);

  if (referralId) {
    const referral = db.prepare('SELECT * FROM TeacherReferral WHERE id = ? AND school_id = ?').get(referralId, req.user.schoolId);
    if (referral) {
      db.prepare("UPDATE TeacherReferral SET status = 'handled', handled_at = datetime('now'), case_id = ? WHERE id = ?").run(id, referralId);
      notify({
        schoolId: req.user.schoolId,
        userId: referral.referred_by,
        type: 'referral_handled',
        message: `הפנייה שלך עבור ${student.first_name} ${student.last_name} טופלה ונפתח תיק`,
        entityType: 'CounselingCase',
        entityId: id,
      });
    }
  }

  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'create', entityType: 'CounselingCase', entityId: id });
  res.status(201).json(db.prepare('SELECT * FROM CounselingCase WHERE id = ?').get(id));
});

router.put('/:id', requireRole(ROLES.COUNSELOR), (req, res) => {
  const row = db.prepare('SELECT * FROM CounselingCase WHERE id = ? AND school_id = ?').get(req.params.id, req.user.schoolId);
  if (!row) return res.status(404).json({ error: 'תיק לא נמצא' });
  const { title, summary, status, confidential } = req.body || {};
  db.prepare(
    `UPDATE CounselingCase SET title = ?, summary = ?, status = ?, confidential = ?, closed_at = ?
     WHERE id = ?`
  ).run(
    title ?? row.title,
    summary ?? row.summary,
    status ?? row.status,
    confidential === undefined ? row.confidential : (confidential ? 1 : 0),
    status === 'closed' ? new Date().toISOString() : status ? null : row.closed_at,
    row.id
  );
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'update', entityType: 'CounselingCase', entityId: row.id });
  res.json(db.prepare('SELECT * FROM CounselingCase WHERE id = ?').get(row.id));
});

export default router;
