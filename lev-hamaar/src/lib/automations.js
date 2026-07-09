import { uid, nowIso, byFamily } from './store';
import { ALERT_LEVELS } from './constants';

const pad = (n) => String(n).padStart(2, '0');
export const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const isoWeek = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return date.getFullYear() + '-W' + (1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7));
};

function timeToDate(baseDate, hhmm) {
  const [h, m] = (hhmm || '08:00').split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m || 0, 0, 0);
  return d;
}

// יוצר רשומות נטילה ("MedicationLog") לתאריך נתון עבור תרופות קבועות (לא לפי-צורך) שעדיין לא נוצרה להן רשומה.
export function ensureTodayMedicationLogs(entities, familyId, today = new Date()) {
  const ds = dateStr(today);
  const meds = byFamily(entities, 'medications', familyId).filter((m) => m.status !== 'הופסקה' && !m.isPRN);
  const drafts = [];
  meds.forEach((med) => {
    (med.times || []).forEach((t) => {
      const logId = `medlog_${med.id}_${ds}_${t}`;
      if (!entities.medicationLogs[logId]) {
        drafts.push({
          id: logId,
          familyId,
          parentId: med.parentId,
          medicationId: med.id,
          date: ds,
          scheduledTime: t,
          status: 'טרם סומנה',
          markedBy: null,
          markedAt: null,
          actualGiver: null,
          verification: null,
          note: '',
        });
      }
    });
  });
  return drafts;
}

function makeAlert({ familyId, parentId, level, message, reason, recipientRoleKeys, relatedEntity, suggestedAction, suggestedActionType, dedupeKey, now, shabbat }) {
  const created = now.toISOString();
  const queued = !!shabbat?.active;
  return {
    id: uid('alert'),
    familyId,
    parentId,
    level,
    message,
    reason,
    recipientRoleKeys: recipientRoleKeys || [],
    relatedEntity: relatedEntity || null,
    suggestedAction: suggestedAction || null,
    suggestedActionType: suggestedActionType || null,
    status: 'פתוחה',
    dedupeKey,
    createdAt: created,
    deliverAt: queued ? shabbat.havdalahIso : created,
    queuedForShabbat: queued,
  };
}

function alreadyExists(entities, dedupeKey) {
  return Object.values(entities.alerts).some((a) => a.dedupeKey === dedupeKey);
}

// מריץ את חמש האוטומציות הפעילות בפיילוט על מצב המשפחה הנוכחי, ומחזיר טיוטות התראה חדשות בלבד (ללא כפילויות).
export function evaluateAutomations({ entities, familyId, now = new Date(), ruleConfig = {}, shabbat }) {
  const alerts = [];
  const cfg = (id, key, def) => (ruleConfig[id] && ruleConfig[id][key] !== undefined ? ruleConfig[id][key] : def);
  const enabled = (id) => ruleConfig[id]?.enabled !== false;

  const meds = byFamily(entities, 'medications', familyId).filter((m) => m.status !== 'הופסקה');
  const medsById = Object.fromEntries(meds.map((m) => [m.id, m]));
  const ds = dateStr(now);

  // א. תרופה שלא סומנה
  if (enabled('med-not-marked')) {
    const grace = cfg('med-not-marked', 'graceMinutes', 30);
    Object.values(entities.medicationLogs)
      .filter((l) => l.familyId === familyId && l.date === ds && l.status === 'טרם סומנה')
      .forEach((log) => {
        const scheduled = timeToDate(now, log.scheduledTime);
        const minutesLate = (now - scheduled) / 60000;
        const med = medsById[log.medicationId];
        if (!med) return;
        if (minutesLate >= grace) {
          const key1 = `med-not-marked:${log.id}:stage1`;
          if (!alreadyExists(entities, key1)) {
            alerts.push(makeAlert({
              familyId, parentId: log.parentId, level: 'REMINDER',
              message: `תרופת "${med.name}" (${log.scheduledTime}) עדיין לא סומנה. כדאי לבדוק אם נלקחה.`,
              reason: `לא סומנה נטילה ${grace} דקות לאחר השעה המתוכננת.`,
              recipientRoleKeys: ['MEDS_OWNER'],
              relatedEntity: { type: 'medicationLog', id: log.id },
              suggestedAction: 'סמן את סטטוס הנטילה', suggestedActionType: 'OPEN_MED_LOG',
              dedupeKey: key1, now, shabbat,
            }));
          }
        }
        if (minutesLate >= grace + 60) {
          const key2 = `med-not-marked:${log.id}:stage2`;
          if (!alreadyExists(entities, key2)) {
            alerts.push(makeAlert({
              familyId, parentId: log.parentId, level: 'TODAY',
              message: `תרופת "${med.name}" (${log.scheduledTime}) טרם סומנה גם לאחר תזכורת. כדאי לבדוק מה קורה.`,
              reason: 'לא סומנה נטילה גם שעה לאחר התזכורת הראשונה.',
              recipientRoleKeys: ['PRIMARY_CAREGIVER', 'FAMILY_ADMIN'],
              relatedEntity: { type: 'medicationLog', id: log.id },
              suggestedAction: 'סמן את סטטוס הנטילה', suggestedActionType: 'OPEN_MED_LOG',
              dedupeKey: key2, now, shabbat,
            }));
          }
        }
      });
  }

  // ב. מלאי תרופה נמוך
  if (enabled('low-inventory')) {
    byFamily(entities, 'inventory', familyId).forEach((inv) => {
      const med = medsById[inv.medicationId];
      if (!med) return;
      const threshold = cfg('low-inventory', 'thresholdOverride', null) ?? inv.thresholdAlert;
      if (inv.quantity <= threshold) {
        const key = `low-inventory:${inv.id}:${ds}`;
        if (!alreadyExists(entities, key)) {
          alerts.push(makeAlert({
            familyId, parentId: inv.parentId, level: 'TODAY',
            message: `המלאי של "${med.name}" נמוך (${inv.quantity} יחידות נותרו).`,
            reason: `כמות במלאי ירדה מתחת לסף שהוגדר (${threshold}).`,
            recipientRoleKeys: ['MEDS_OWNER'],
            relatedEntity: { type: 'medication', id: med.id },
            suggestedAction: med.needsPrescription ? 'ליצור משימת רכישה ולבדוק צורך במרשם' : 'ליצור משימת רכישה',
            suggestedActionType: 'CREATE_PURCHASE_TASK',
            dedupeKey: key, now, shabbat,
          }));
        }
      }
      if (med.renewalDate) {
        const daysLeft = Math.ceil((new Date(med.renewalDate) - now) / 86400000);
        if (daysLeft >= 0 && daysLeft <= 5) {
          const key = `renewal:${med.id}:${ds}`;
          if (!alreadyExists(entities, key)) {
            alerts.push(makeAlert({
              familyId, parentId: med.parentId, level: 'REMINDER',
              message: `מרשם התרופה "${med.name}" מתקרב לחידוש (${med.renewalDate}).`,
              reason: 'תאריך חידוש מרשם בעוד 5 ימים או פחות.',
              recipientRoleKeys: ['MEDS_OWNER'],
              relatedEntity: { type: 'medication', id: med.id },
              suggestedAction: 'ליצור משימת חידוש מרשם', suggestedActionType: 'CREATE_RENEWAL_TASK',
              dedupeKey: key, now, shabbat,
            }));
          }
        }
      }
    });
  }

  // ג. תזכורת לתור והכנה
  if (enabled('appointment-prep')) {
    byFamily(entities, 'appointments', familyId).forEach((appt) => {
      const apptDate = new Date(`${appt.date}T${appt.time || '09:00'}`);
      const daysUntil = Math.floor((new Date(dateStr(apptDate)) - new Date(ds)) / 86400000);
      if (daysUntil === 3) {
        const key = `appt:${appt.id}:3days`;
        if (!alreadyExists(entities, key)) {
          alerts.push(makeAlert({
            familyId, parentId: appt.parentId, level: 'REMINDER',
            message: `בעוד 3 ימים תור ל${appt.type || 'רופא'}. כדאי לוודא מלווה ומסמכים.`,
            reason: 'תזכורת מוקדמת לפני תור.',
            recipientRoleKeys: ['APPOINTMENTS_OWNER', 'PRIMARY_CAREGIVER'],
            relatedEntity: { type: 'appointment', id: appt.id },
            suggestedAction: appt.escort ? 'להכין שאלות לרופא' : 'לשבץ מלווה לתור',
            suggestedActionType: 'OPEN_APPOINTMENT',
            dedupeKey: key, now, shabbat,
          }));
        }
      }
      if (daysUntil === 1) {
        const key = `appt:${appt.id}:1day`;
        if (!alreadyExists(entities, key)) {
          alerts.push(makeAlert({
            familyId, parentId: appt.parentId, level: 'TODAY',
            message: `מחר בשעה ${appt.time || ''} תור ל${appt.type || 'רופא'} ב${appt.clinic || 'המרפאה'}. מלווה: ${appt.escort || 'טרם שובץ'}.`,
            reason: 'תזכורת יום לפני התור.',
            recipientRoleKeys: ['APPOINTMENTS_OWNER', 'PRIMARY_CAREGIVER'],
            relatedEntity: { type: 'appointment', id: appt.id },
            suggestedAction: 'לבדוק מסמכים והכנה', suggestedActionType: 'OPEN_APPOINTMENT',
            dedupeKey: key, now, shabbat,
          }));
        }
      }
      if (daysUntil === 0) {
        const key = `appt:${appt.id}:today`;
        if (!alreadyExists(entities, key)) {
          alerts.push(makeAlert({
            familyId, parentId: appt.parentId, level: 'TODAY',
            message: `היום בשעה ${appt.time || ''} תור ל${appt.type || 'רופא'}.`,
            reason: 'תזכורת בוקר התור.',
            recipientRoleKeys: ['APPOINTMENTS_OWNER', 'PRIMARY_CAREGIVER'],
            relatedEntity: { type: 'appointment', id: appt.id },
            dedupeKey: key, now, shabbat,
          }));
        }
      }
      if (daysUntil < 0 && daysUntil >= -3 && !appt.summary) {
        const key = `appt:${appt.id}:followup`;
        if (!alreadyExists(entities, key)) {
          alerts.push(makeAlert({
            familyId, parentId: appt.parentId, level: 'INFO',
            message: `התור ל${appt.type || 'רופא'} התקיים. האם תרצו לתעד מה הוחלט בפגישה?`,
            reason: 'התור חלף וטרם תועד סיכום.',
            recipientRoleKeys: ['APPOINTMENTS_OWNER', 'PRIMARY_CAREGIVER'],
            relatedEntity: { type: 'appointment', id: appt.id },
            suggestedAction: 'להוסיף סיכום לאחר התור', suggestedActionType: 'OPEN_APPOINTMENT',
            dedupeKey: key, now, shabbat,
          }));
        }
      }
    });
  }

  // ד. תורנות לא מאוישת
  if (enabled('unstaffed-shift')) {
    const leadDays = cfg('unstaffed-shift', 'leadDays', 2);
    byFamily(entities, 'shifts', familyId).forEach((shift) => {
      const shiftDate = new Date(shift.date);
      const daysUntil = Math.floor((new Date(dateStr(shiftDate)) - new Date(ds)) / 86400000);
      if (shift.status === 'פנויה' && daysUntil >= 0 && daysUntil <= leadDays) {
        const key = `shift:${shift.id}:unstaffed`;
        if (!alreadyExists(entities, key)) {
          const dayLabel = shiftDate.toLocaleDateString('he-IL', { weekday: 'long' });
          alerts.push(makeAlert({
            familyId, parentId: shift.parentId, level: 'TODAY',
            message: `${dayLabel} עדיין פנוי (${shift.type}). מי יכול לקחת את זה?`,
            reason: 'תורנות מתקרבת ללא משובץ.',
            recipientRoleKeys: ['FAMILY_ADMIN', 'PRIMARY_CAREGIVER', 'FAMILY_MEMBER'],
            relatedEntity: { type: 'shift', id: shift.id },
            suggestedAction: 'להתנדב לתורנות', suggestedActionType: 'OPEN_SHIFT',
            dedupeKey: key, now, shabbat,
          }));
        }
      }
      if (shift.status === 'בוטלה' && !shift.cancelNoticeGiven) {
        const key = `shift:${shift.id}:cancelled-notice`;
        if (!alreadyExists(entities, key)) {
          alerts.push(makeAlert({
            familyId, parentId: shift.parentId, level: 'URGENT',
            message: `תורנות (${shift.type}) בוטלה. יש למצוא מחליף.`,
            reason: 'תורנות בוטלה וטרם נמצא מחליף.',
            recipientRoleKeys: ['FAMILY_ADMIN'],
            relatedEntity: { type: 'shift', id: shift.id },
            suggestedAction: 'להציע זמינים / לבקש החלפה', suggestedActionType: 'OPEN_SHIFT',
            dedupeKey: key, now, shabbat,
          }));
        }
      }
    });
  }

  // ה. סיכום שבועי למשפחה
  if (enabled('weekly-summary')) {
    const week = isoWeek(now);
    const key = `weekly:${familyId}:${week}`;
    const sendDay = cfg('weekly-summary', 'sendDay', 5); // 5=שישי
    if (now.getDay() === sendDay && !alreadyExists(entities, key)) {
      alerts.push(makeAlert({
        familyId, parentId: null, level: 'INFO',
        message: 'הסיכום השבועי של המשפחה מוכן לצפייה.',
        reason: 'הגיע מועד הסיכום השבועי שנבחר.',
        recipientRoleKeys: ['FAMILY_ADMIN', 'PRIMARY_CAREGIVER', 'FAMILY_MEMBER', 'MEDS_OWNER', 'APPOINTMENTS_OWNER'],
        relatedEntity: { type: 'weeklyReport', id: week },
        suggestedAction: 'לצפות בסיכום השבועי', suggestedActionType: 'OPEN_WEEKLY_REPORT',
        dedupeKey: key, now, shabbat,
      }));
    }
  }

  return alerts;
}

export function alertLevelMeta(level) {
  return ALERT_LEVELS[level] || ALERT_LEVELS.INFO;
}
