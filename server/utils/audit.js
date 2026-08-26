import { db } from '../db.js';
import { newId } from './ids.js';

export function logAudit({ schoolId, userId, action, entityType, entityId, details }) {
  db.prepare(
    `INSERT INTO AuditLog (id, school_id, user_id, action, entity_type, entity_id, details)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(newId('audit'), schoolId, userId || null, action, entityType, entityId || null, details ? JSON.stringify(details) : null);
}

export function notify({ schoolId, userId, type, message, entityType, entityId }) {
  db.prepare(
    `INSERT INTO Notification (id, school_id, user_id, type, message, entity_type, entity_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(newId('notif'), schoolId, userId, type, message, entityType || null, entityId || null);
}
