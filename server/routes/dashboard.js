import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { ROLES, getTeacherClassIds } from '../middleware/authorize.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const schoolId = req.user.schoolId;

  if (req.user.role === ROLES.COUNSELOR) {
    const meetingsToday = db
      .prepare("SELECT m.*, s.first_name, s.last_name FROM Meeting m LEFT JOIN Student s ON s.id = m.student_id WHERE m.school_id = ? AND date(m.meeting_date) = date('now') ORDER BY m.meeting_date")
      .all(schoolId);
    const tasksToday = db
      .prepare("SELECT * FROM Task WHERE school_id = ? AND date(due_date) = date('now') AND status != 'done' ORDER BY priority DESC")
      .all(schoolId);
    const tasksOverdue = db
      .prepare("SELECT * FROM Task WHERE school_id = ? AND date(due_date) < date('now') AND status != 'done' ORDER BY due_date")
      .all(schoolId);
    const activeCases = db
      .prepare("SELECT COUNT(*) as c FROM CounselingCase WHERE school_id = ? AND status != 'closed'")
      .get(schoolId).c;
    const newReferrals = db
      .prepare("SELECT r.*, s.first_name, s.last_name FROM TeacherReferral r JOIN Student s ON s.id = r.student_id WHERE r.school_id = ? AND r.status = 'new' ORDER BY r.created_at DESC")
      .all(schoolId);
    const followUps = db
      .prepare("SELECT m.*, s.first_name, s.last_name FROM Meeting m LEFT JOIN Student s ON s.id = m.student_id WHERE m.school_id = ? AND m.follow_up IS NOT NULL AND m.follow_up != '' AND date(m.meeting_date) >= date('now','-30 day') ORDER BY m.meeting_date DESC LIMIT 10")
      .all(schoolId);

    return res.json({
      role: req.user.role,
      meetingsToday,
      tasksToday,
      tasksOverdue,
      activeCasesCount: activeCases,
      newReferrals,
      followUps,
    });
  }

  if (req.user.role === ROLES.TEACHER) {
    const classIds = getTeacherClassIds(req.user.id);
    const placeholders = classIds.map(() => '?').join(',') || "''";
    const students = classIds.length
      ? db.prepare(`SELECT * FROM Student WHERE class_id IN (${placeholders}) AND status = 'active'`).all(...classIds)
      : [];
    const myTasksToday = db
      .prepare("SELECT * FROM Task WHERE school_id = ? AND assignee_id = ? AND date(due_date) = date('now') AND status != 'done'")
      .all(schoolId, req.user.id);
    const myTasksOverdue = db
      .prepare("SELECT * FROM Task WHERE school_id = ? AND assignee_id = ? AND date(due_date) < date('now') AND status != 'done'")
      .all(schoolId, req.user.id);
    const myReferrals = db
      .prepare('SELECT r.*, s.first_name, s.last_name FROM TeacherReferral r JOIN Student s ON s.id = r.student_id WHERE r.referred_by = ? ORDER BY r.created_at DESC')
      .all(req.user.id);
    return res.json({
      role: req.user.role,
      classCount: classIds.length,
      studentCount: students.length,
      myTasksToday,
      myTasksOverdue,
      myReferrals,
    });
  }

  if (req.user.role === ROLES.PRINCIPAL) {
    const activeCases = db.prepare("SELECT COUNT(*) as c FROM CounselingCase WHERE school_id = ? AND status != 'closed'").get(schoolId).c;
    const meetingsToday = db.prepare("SELECT COUNT(*) as c FROM Meeting WHERE school_id = ? AND date(meeting_date) = date('now')").get(schoolId).c;
    const overdueTasks = db.prepare("SELECT COUNT(*) as c FROM Task WHERE school_id = ? AND date(due_date) < date('now') AND status != 'done'").get(schoolId).c;
    const studentsCount = db.prepare("SELECT COUNT(*) as c FROM Student WHERE school_id = ? AND status = 'active'").get(schoolId).c;
    const openReferrals = db.prepare("SELECT COUNT(*) as c FROM TeacherReferral WHERE school_id = ? AND status = 'new'").get(schoolId).c;
    return res.json({ role: req.user.role, activeCases, meetingsToday, overdueTasks, studentsCount, openReferrals });
  }

  // admin
  const usersCount = db.prepare('SELECT COUNT(*) as c FROM User WHERE school_id = ? AND active = 1').get(schoolId).c;
  const classesCount = db.prepare('SELECT COUNT(*) as c FROM Class WHERE school_id = ?').get(schoolId).c;
  const recentAudit = db.prepare('SELECT * FROM AuditLog WHERE school_id = ? ORDER BY created_at DESC LIMIT 15').all(schoolId);
  return res.json({ role: req.user.role, usersCount, classesCount, recentAudit });
});

export default router;
