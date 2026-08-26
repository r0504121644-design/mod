import express from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES, blockAdminFromClinicalContent, getTeacherClassIds } from '../middleware/authorize.js';
import { newId } from '../utils/ids.js';
import { logAudit, notify } from '../utils/audit.js';

const router = express.Router();
router.use(requireAuth, blockAdminFromClinicalContent);

function scopeRows(rows, user) {
  if (user.role !== ROLES.TEACHER) return rows;
  const classIds = getTeacherClassIds(user.id);
  return rows.filter((t) => {
    if (t.assignee_id === user.id) return true;
    if (!t.student_id) return false;
    const student = db.prepare('SELECT class_id FROM Student WHERE id = ?').get(t.student_id);
    return student && classIds.includes(student.class_id);
  });
}

router.get('/', (req, res) => {
  const { view, studentId, caseId } = req.query;
  let sql = 'SELECT t.*, u.name as assignee_name, s.first_name as student_first_name, s.last_name as student_last_name FROM Task t LEFT JOIN User u ON u.id = t.assignee_id LEFT JOIN Student s ON s.id = t.student_id WHERE t.school_id = ?';
  const args = [req.user.schoolId];
  if (studentId) {
    sql += ' AND t.student_id = ?';
    args.push(studentId);
  }
  if (caseId) {
    sql += ' AND t.case_id = ?';
    args.push(caseId);
  }
  switch (view) {
    case 'today':
      sql += " AND date(t.due_date) = date('now') AND t.status != 'done'";
      break;
    case 'week':
      sql += " AND date(t.due_date) BETWEEN date('now') AND date('now','+7 day') AND t.status != 'done'";
      break;
    case 'overdue':
      sql += " AND date(t.due_date) < date('now') AND t.status != 'done'";
      break;
    case 'upcoming':
      sql += " AND date(t.due_date) > date('now','+7 day') AND t.status != 'done'";
      break;
    case 'done':
      sql += " AND t.status = 'done'";
      break;
    default:
      break;
  }
  sql += ' ORDER BY t.due_date ASC';
  const rows = scopeRows(db.prepare(sql).all(...args), req.user);
  res.json(rows);
});

router.post('/', requireRole(ROLES.COUNSELOR), (req, res) => {
  const { title, description, assigneeId, dueDate, priority, studentId, caseId, meetingId } = req.body || {};
  if (!title) return res.status(400).json({ error: 'נא להזין כותרת למשימה' });
  const id = newId('task');
  db.prepare(
    `INSERT INTO Task (id, school_id, title, description, assignee_id, due_date, priority, student_id, case_id, meeting_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.schoolId, title, description || null, assigneeId || req.user.id, dueDate || null, priority || 'medium', studentId || null, caseId || null, meetingId || null, req.user.id);

  if (assigneeId && assigneeId !== req.user.id) {
    notify({ schoolId: req.user.schoolId, userId: assigneeId, type: 'task_assigned', message: `הוקצתה לך משימה חדשה: ${title}`, entityType: 'Task', entityId: id });
  }
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'create', entityType: 'Task', entityId: id });
  res.status(201).json(db.prepare('SELECT * FROM Task WHERE id = ?').get(id));
});

router.put('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM Task WHERE id = ? AND school_id = ?').get(req.params.id, req.user.schoolId);
  if (!row) return res.status(404).json({ error: 'משימה לא נמצאה' });
  const isOwnerCounselor = req.user.role === ROLES.COUNSELOR;
  const isAssignee = row.assignee_id === req.user.id;
  if (!isOwnerCounselor && !isAssignee) return res.status(403).json({ error: 'אין הרשאה לעדכן משימה זו' });

  const { title, description, assigneeId, dueDate, priority, status } = req.body || {};
  if (!isOwnerCounselor && (title || description || assigneeId || dueDate || priority)) {
    return res.status(403).json({ error: 'ניתן לעדכן רק סטטוס' });
  }
  db.prepare(
    `UPDATE Task SET title = ?, description = ?, assignee_id = ?, due_date = ?, priority = ?, status = ?, completed_at = ? WHERE id = ?`
  ).run(
    title ?? row.title,
    description ?? row.description,
    assigneeId ?? row.assignee_id,
    dueDate ?? row.due_date,
    priority ?? row.priority,
    status ?? row.status,
    status === 'done' ? new Date().toISOString() : status ? null : row.completed_at,
    row.id
  );
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'update', entityType: 'Task', entityId: row.id });
  res.json(db.prepare('SELECT * FROM Task WHERE id = ?').get(row.id));
});

export default router;
