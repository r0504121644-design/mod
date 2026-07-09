import React from 'react';
import { useApp } from '../context/AppContext';
import { list } from '../lib/store';
import { PILOT_TARGETS } from '../lib/constants';

function pct(n) { return isFinite(n) ? `${Math.round(n * 100)}%` : '—'; }

export default function AdminMetricsScreen() {
  const { entities, currentFamily } = useApp();
  if (!currentFamily) return null;

  const familyId = currentFamily.id;
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const medLogs = list(entities, 'medicationLogs').filter((l) => l.familyId === familyId && l.date <= today);
  const medOnTimeRate = medLogs.length ? medLogs.filter((l) => l.status === 'נלקחה').length / medLogs.length : null;

  const visitReports = list(entities, 'visitReports').filter((v) => v.familyId === familyId);

  const auditThisWeek = list(entities, 'auditLog').filter((l) => l.familyId === familyId && l.createdAt >= sevenDaysAgo);
  const activeMembersThisWeek = new Set(auditThisWeek.map((l) => l.actorUserId).filter(Boolean)).size;

  const handledAlerts = list(entities, 'alerts').filter((a) => a.familyId === familyId && a.handledAt);
  const avgResponseMin = handledAlerts.length
    ? Math.round(handledAlerts.reduce((sum, a) => sum + (new Date(a.handledAt) - new Date(a.createdAt)) / 60000, 0) / handledAlerts.length)
    : null;

  const shifts = list(entities, 'shifts').filter((s) => s.familyId === familyId && s.status !== 'בוטלה');
  const shiftsStaffedRate = shifts.length ? shifts.filter((s) => s.assigneeUserId).length / shifts.length : null;

  const actorCounts = {};
  list(entities, 'auditLog').filter((l) => l.familyId === familyId).forEach((l) => {
    if (!l.actorUserId) return;
    actorCounts[l.actorUserId] = (actorCounts[l.actorUserId] || 0) + 1;
  });
  const totalActions = Object.values(actorCounts).reduce((a, b) => a + b, 0);
  const maxActorActions = Math.max(0, ...Object.values(actorCounts));
  const loadConcentration = totalActions ? maxActorActions / totalActions : null;

  const respondedAlerts = list(entities, 'alerts').filter((a) => a.familyId === familyId && a.suggestedAction && ['טופלה', 'נדחתה'].includes(a.status));
  const approvedAlerts = respondedAlerts.filter((a) => a.status === 'טופלה');
  const approvalRate = respondedAlerts.length ? approvedAlerts.length / respondedAlerts.length : null;

  const urgentAlerts = list(entities, 'alerts').filter((a) => a.familyId === familyId && a.level === 'URGENT').length;
  const clarifyConsents = list(entities, 'consents').filter((c) => c.familyId === familyId && c.status === 'דורשת בירור').length;

  const Tile = ({ label, value, target, note }) => (
    <div className="card">
      <p className="small muted">{label}</p>
      <h2>{value}</h2>
      {target && <p className="small">יעד: {target}</p>}
      {note && <p className="small muted">{note}</p>}
    </div>
  );

  return (
    <div className="stack">
      <h1>לוח מדדי הצלחה — מנהל הפיילוט</h1>
      <p className="muted small">מוצג למנהל המשפחתי בלבד. משמש למעקב עצמי אחר יעדי הפיילוט, ולא משותף חוץ־משפחתית ברמת פרט.</p>

      <div className="grid grid-3">
        <Tile label="שיעור סימון תרופות בזמן" value={pct(medOnTimeRate)} target={pct(PILOT_TARGETS.medOnTimeRate)} />
        <Tile label="דיווחי ביקור שהוגשו (7 ימים)" value={visitReports.length} note="חישוב מדויק של חלון 24 שעות ממועד הביקור בפועל ידרוש קישור תורנות-דיווח בשלב הבא." />
        <Tile label="בני משפחה פעילים השבוע" value={activeMembersThisWeek} target={`${PILOT_TARGETS.weeklyActiveMembers}+`} />
        <Tile label="זמן ממוצע מהתראה ועד טיפול" value={avgResponseMin != null ? `${avgResponseMin} דק׳` : '—'} />
        <Tile label="תורנויות מאוישות מראש" value={pct(shiftsStaffedRate)} target={pct(PILOT_TARGETS.shiftsStaffedAdvance)} />
        <Tile label="ריכוז עומס אצל המשתמש הפעיל ביותר" value={pct(loadConcentration)} note="ירידה לאורך הפיילוט = הקלה על המטפל העיקרי." />
        <Tile label="שיעור אישור הצעות הסוכן/אוטומציה" value={pct(approvalRate)} />
        <Tile label="התראות ברמה דחופה" value={urgentAlerts} />
        <Tile label="הסכמות הדורשות בירור" value={clarifyConsents} />
      </div>

      <div className="card">
        <h3>מדדים איכותניים (ידניים)</h3>
        <p className="small muted">תחושת עומס, סדר, ביטחון ושותפות משפחתית נמדדים באמצעות סקרים בתחילת הפיילוט ובסיומו, מחוץ למערכת זו.</p>
      </div>
    </div>
  );
}
