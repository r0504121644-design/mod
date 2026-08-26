import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { ROLES, blockAdminFromClinicalContent, getTeacherClassIds } from '../middleware/authorize.js';

const router = express.Router();
router.use(requireAuth, blockAdminFromClinicalContent);

router.get('/', (req, res) => {
  const { studentId } = req.query;
  if (!studentId) return res.status(400).json({ error: 'נא לציין תלמידה' });

  const student = db.prepare('SELECT * FROM Student WHERE id = ? AND school_id = ?').get(studentId, req.user.schoolId);
  if (!student) return res.status(404).json({ error: 'תלמידה לא נמצאה' });

  if (req.user.role === ROLES.TEACHER) {
    const classIds = getTeacherClassIds(req.user.id);
    if (!classIds.includes(student.class_id)) return res.status(403).json({ error: 'אין הרשאה לתלמידה זו' });
  }

  const isTeacher = req.user.role === ROLES.TEACHER;
  const isPrincipal = req.user.role === ROLES.PRINCIPAL;
  const events = [];

  const meetings = db.prepare('SELECT * FROM Meeting WHERE student_id = ? AND school_id = ?').all(studentId, req.user.schoolId);
  for (const m of meetings) {
    if (isTeacher && m.confidential) continue;
    const confidentialHidden = isPrincipal && m.confidential;
    events.push({
      id: m.id,
      entityType: 'Meeting',
      date: m.meeting_date,
      confidential: !!m.confidential,
      title: `פגישת ${meetingTypeLabel(m.type)}`,
      summary: confidentialHidden ? 'תוכן חסוי' : (m.purpose || m.topics || ''),
      link: { kind: 'meeting', id: m.id },
    });
  }

  const observations = db.prepare('SELECT * FROM Observation WHERE student_id = ? AND school_id = ?').all(studentId, req.user.schoolId);
  for (const o of observations) {
    if (isTeacher && o.confidential) continue;
    const confidentialHidden = isPrincipal && o.confidential;
    events.push({
      id: o.id,
      entityType: 'Observation',
      date: o.observation_date,
      confidential: !!o.confidential,
      title: 'תצפית',
      summary: confidentialHidden ? 'תוכן חסוי' : o.content,
      link: { kind: 'observation', id: o.id },
    });
  }

  const referrals = db.prepare('SELECT * FROM TeacherReferral WHERE student_id = ? AND school_id = ?').all(studentId, req.user.schoolId);
  for (const r of referrals) {
    events.push({
      id: r.id,
      entityType: 'TeacherReferral',
      date: r.created_at,
      confidential: false,
      title: 'פנייה ממחנכת',
      summary: r.reason,
      link: { kind: 'referral', id: r.id },
    });
  }

  if (!isTeacher) {
    const plans = db.prepare('SELECT * FROM InterventionPlan WHERE student_id = ? AND school_id = ?').all(studentId, req.user.schoolId);
    for (const p of plans) {
      events.push({
        id: p.id,
        entityType: 'InterventionPlan',
        date: p.created_at,
        confidential: false,
        title: `תוכנית התערבות: ${p.title}`,
        summary: `סטטוס: ${p.status === 'active' ? 'פעילה' : 'הושלמה'}`,
        link: { kind: 'plan', id: p.id },
      });
    }

    const cases = db.prepare('SELECT * FROM CounselingCase WHERE student_id = ? AND school_id = ?').all(studentId, req.user.schoolId);
    for (const c of cases) {
      const confidentialHidden = isPrincipal && c.confidential;
      events.push({
        id: c.id,
        entityType: 'CounselingCase',
        date: c.opened_at,
        confidential: !!c.confidential,
        title: `תיק נפתח: ${c.title}`,
        summary: confidentialHidden ? 'תוכן חסוי' : (c.summary || ''),
        link: { kind: 'case', id: c.id },
      });
    }
  }

  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(events);
});

function meetingTypeLabel(type) {
  const labels = {
    student: 'תלמידה',
    parents: 'הורים',
    teacher: 'מחנכת',
    staff: 'צוות',
    management: 'הנהלה',
    professional: 'גורם מקצועי',
  };
  return labels[type] || type;
}

export default router;
