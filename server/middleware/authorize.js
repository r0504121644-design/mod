import { db } from '../db.js';

// Central, server-side authorization rules. The UI may hide controls, but
// every route re-checks these rules against req.user pulled from the verified
// JWT + DB lookup (see middleware/auth.js) — never from client input.

export const ROLES = {
  COUNSELOR: 'counselor',
  TEACHER: 'teacher',
  PRINCIPAL: 'principal',
  ADMIN: 'admin',
};

// Roles that may ever touch clinical/counseling content (cases, meetings,
// observations, referrals, intervention plans/goals, student-linked tasks,
// attachments). Admin is technical-only and is excluded on purpose.
export function blockAdminFromClinicalContent(req, res, next) {
  if (req.user.role === ROLES.ADMIN) {
    return res.status(403).json({ error: 'למשתמשת Admin אין גישה לתוכן ייעוצי' });
  }
  next();
}

export function getTeacherClassIds(userId) {
  return db
    .prepare('SELECT id FROM Class WHERE homeroom_teacher_id = ?')
    .all(userId)
    .map((r) => r.id);
}

// Throws via res if the teacher isn't the homeroom teacher of the student's class.
export function teacherCanAccessStudent(user, student) {
  if (!student) return false;
  if (user.role !== ROLES.TEACHER) return true;
  const classIds = getTeacherClassIds(user.id);
  return classIds.includes(student.class_id);
}

// Strips confidential content a role is not entitled to see.
// entity must have a `confidential` (0/1) column.
export function maskConfidential(entity, user, fields) {
  if (!entity) return entity;
  const isConfidential = !!entity.confidential;
  if (!isConfidential) return entity;
  if (user.role === ROLES.COUNSELOR) return entity;
  if (user.role === ROLES.TEACHER) return null; // teacher never sees confidential rows
  if (user.role === ROLES.PRINCIPAL) {
    const masked = { ...entity, confidential_masked: true };
    for (const f of fields) masked[f] = null;
    return masked;
  }
  return null; // admin
}

export function maskCaseSummary(caseRow, user) {
  if (!caseRow) return caseRow;
  if (user.role === ROLES.COUNSELOR) return caseRow;
  if (user.role === ROLES.PRINCIPAL) {
    if (caseRow.confidential) {
      return { ...caseRow, summary: null, confidential_masked: true };
    }
    return caseRow;
  }
  return null; // teacher/admin: no case access at all (handled by route guard too)
}
