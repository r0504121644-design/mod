import express from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES, blockAdminFromClinicalContent } from '../middleware/authorize.js';
import { newId } from '../utils/ids.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();
router.use(requireAuth, blockAdminFromClinicalContent);

router.get('/', (req, res) => {
  const { studentId } = req.query;
  let sql = 'SELECT * FROM InterventionPlan WHERE school_id = ?';
  const args = [req.user.schoolId];
  if (studentId) {
    sql += ' AND student_id = ?';
    args.push(studentId);
  }
  sql += ' ORDER BY created_at DESC';
  const plans = db.prepare(sql).all(...args);
  for (const p of plans) {
    p.goals = db.prepare('SELECT * FROM InterventionGoal WHERE plan_id = ? ORDER BY created_at').all(p.id);
  }
  res.json(plans);
});

router.post('/', requireRole(ROLES.COUNSELOR), (req, res) => {
  const { studentId, caseId, title, startDate, endDate } = req.body || {};
  if (!studentId || !title) return res.status(400).json({ error: 'נא לבחור תלמידה ולהזין כותרת לתוכנית' });
  const id = newId('plan');
  db.prepare(
    `INSERT INTO InterventionPlan (id, school_id, student_id, case_id, title, start_date, end_date, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.schoolId, studentId, caseId || null, title, startDate || null, endDate || null, req.user.id);
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'create', entityType: 'InterventionPlan', entityId: id });
  res.status(201).json({ ...db.prepare('SELECT * FROM InterventionPlan WHERE id = ?').get(id), goals: [] });
});

router.put('/:id', requireRole(ROLES.COUNSELOR), (req, res) => {
  const row = db.prepare('SELECT * FROM InterventionPlan WHERE id = ? AND school_id = ?').get(req.params.id, req.user.schoolId);
  if (!row) return res.status(404).json({ error: 'תוכנית לא נמצאה' });
  const { title, status, startDate, endDate } = req.body || {};
  db.prepare('UPDATE InterventionPlan SET title = ?, status = ?, start_date = ?, end_date = ? WHERE id = ?').run(
    title ?? row.title, status ?? row.status, startDate ?? row.start_date, endDate ?? row.end_date, row.id
  );
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'update', entityType: 'InterventionPlan', entityId: row.id });
  res.json(db.prepare('SELECT * FROM InterventionPlan WHERE id = ?').get(row.id));
});

router.post('/:id/goals', requireRole(ROLES.COUNSELOR), (req, res) => {
  const plan = db.prepare('SELECT * FROM InterventionPlan WHERE id = ? AND school_id = ?').get(req.params.id, req.user.schoolId);
  if (!plan) return res.status(404).json({ error: 'תוכנית לא נמצאה' });
  const { description, targetDate } = req.body || {};
  if (!description) return res.status(400).json({ error: 'נא להזין תיאור מטרה' });
  const id = newId('goal');
  db.prepare(
    `INSERT INTO InterventionGoal (id, school_id, plan_id, student_id, description, target_date)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.schoolId, plan.id, plan.student_id, description, targetDate || null);
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'create', entityType: 'InterventionGoal', entityId: id });
  res.status(201).json(db.prepare('SELECT * FROM InterventionGoal WHERE id = ?').get(id));
});

router.put('/goals/:goalId', requireRole(ROLES.COUNSELOR), (req, res) => {
  const goal = db.prepare('SELECT * FROM InterventionGoal WHERE id = ? AND school_id = ?').get(req.params.goalId, req.user.schoolId);
  if (!goal) return res.status(404).json({ error: 'מטרה לא נמצאה' });
  const { description, status, targetDate } = req.body || {};
  db.prepare('UPDATE InterventionGoal SET description = ?, status = ?, target_date = ? WHERE id = ?').run(
    description ?? goal.description, status ?? goal.status, targetDate ?? goal.target_date, goal.id
  );
  logAudit({ schoolId: req.user.schoolId, userId: req.user.id, action: 'update', entityType: 'InterventionGoal', entityId: goal.id });
  res.json(db.prepare('SELECT * FROM InterventionGoal WHERE id = ?').get(goal.id));
});

export default router;
