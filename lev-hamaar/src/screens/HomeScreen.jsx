import React from 'react';
import { useApp } from '../context/AppContext';
import { byFamily, byParent } from '../lib/store';
import { dateStr } from '../lib/automations';
import { Badge } from '../components/UI';

export default function HomeScreen({ navigate }) {
  const { entities, currentFamily, currentParent, notify, upsert } = useApp();
  if (!currentFamily || !currentParent) return null;
  const ds = dateStr(new Date());

  const todayMedLogs = Object.values(entities.medicationLogs).filter(
    (l) => l.parentId === currentParent.id && l.date === ds
  );
  const pendingMeds = todayMedLogs.filter((l) => l.status === 'טרם סומנה');
  const meds = byParent(entities, 'medications', currentParent.id).filter((m) => m.status !== 'הופסקה');
  const todayAppts = byParent(entities, 'appointments', currentParent.id).filter((a) => a.date === ds);
  const lowInventory = byParent(entities, 'inventory', currentParent.id).filter((inv) => inv.quantity <= inv.thresholdAlert);
  const overdueTasks = byParent(entities, 'tasks', currentParent.id).filter(
    (t) => t.dueDate && t.dueDate < ds && !['הושלם', 'בוטל'].includes(t.status)
  );
  const openAlerts = Object.values(entities.alerts).filter(
    (a) => a.familyId === currentFamily.id && (!a.parentId || a.parentId === currentParent.id) && a.status === 'פתוחה' && a.deliverAt <= new Date().toISOString()
  );

  const topItems = [];
  if (pendingMeds.length) topItems.push({ icon: '💊', text: `${pendingMeds.length} תרופות עדיין לא סומנו היום`, action: () => navigate('medications') });
  if (todayAppts.length) topItems.push({ icon: '🩺', text: `היום יש תור בשעה ${todayAppts[0].time || ''} (${todayAppts[0].type})`, action: () => navigate('appointments') });
  if (lowInventory.length) topItems.push({ icon: '📦', text: `המלאי של ${lowInventory.length} תרופות נמוך`, action: () => navigate('medications') });
  if (overdueTasks.length && topItems.length < 3) topItems.push({ icon: '✅', text: `${overdueTasks.length} משימות באיחור`, action: () => navigate('tasks') });

  function markMedTaken(log) {
    upsert('medicationLogs', {
      id: log.id, status: 'נלקחה', markedAt: new Date().toISOString(), verification: 'ההורה דיווח',
    }, { note: 'סומן כנלקחה ממסך הבית' });
    notify('סומן כנלקחה ✓');
  }

  return (
    <div className="stack">
      <div className="section-header">
        <h1>מה חשוב היום?</h1>
        <span className="muted small">{new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </div>

      {topItems.length > 0 ? (
        <div className="grid grid-3">
          {topItems.slice(0, 3).map((it, i) => (
            <button key={i} className="card" style={{ textAlign: 'right', cursor: 'pointer' }} onClick={it.action}>
              <div style={{ fontSize: '1.6rem' }}>{it.icon}</div>
              <p style={{ marginTop: 8, fontWeight: 600 }}>{it.text}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="card">
          <p>היום נראה רגוע — אין דברים דחופים שזיהינו. ✨</p>
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <h3>תרופות היום</h3>
          {todayMedLogs.length === 0 && <p className="muted small">אין תרופות מתוכננות להיום.</p>}
          {todayMedLogs.map((l) => {
            const med = meds.find((m) => m.id === l.medicationId);
            return (
              <div className="list-row" key={l.id}>
                <span>{med?.name} — {l.scheduledTime}</span>
                {l.status === 'טרם סומנה' ? (
                  <button className="btn btn-sm btn-primary" onClick={() => markMedTaken(l)}>סמן כנלקחה</button>
                ) : (
                  <Badge tone="success">{l.status}</Badge>
                )}
              </div>
            );
          })}
        </div>

        <div className="card">
          <h3>התראות פתוחות</h3>
          {openAlerts.length === 0 && <p className="muted small">אין התראות פתוחות כרגע.</p>}
          {openAlerts.slice(0, 4).map((a) => (
            <div className="list-row" key={a.id}>
              <span className="small">{a.message}</span>
            </div>
          ))}
          {openAlerts.length > 0 && <button className="btn btn-secondary btn-sm" onClick={() => navigate('alerts')}>לכל ההתראות</button>}
        </div>
      </div>

      <div className="card">
        <h3>פעולות מהירות</h3>
        <div className="row">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('measurements')}>➕ מדידה</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('medications')}>💊 סימון תרופה</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('appointments')}>🩺 הוספת תור</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('visitReport')}>📝 דיווח ביקור</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('documents')}>📁 העלאת מסמך</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('tasks')}>➕ משימה</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('agent')}>💬 שיחה עם הסוכן</button>
        </div>
      </div>
    </div>
  );
}
