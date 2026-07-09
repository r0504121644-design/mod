import React from 'react';
import { useApp } from '../context/AppContext';
import { list, sortByDateDesc } from '../lib/store';
import { alertLevelMeta } from '../lib/automations';
import { EmptyState, Badge } from '../components/UI';

export default function AlertsScreen() {
  const { entities, currentFamily, currentParent, upsert, currentUser, notify } = useApp();
  if (!currentFamily) return null;
  const nowIso = new Date().toISOString();

  const familyAlerts = list(entities, 'alerts').filter(
    (a) => a.familyId === currentFamily.id && (!a.parentId || !currentParent || a.parentId === currentParent.id)
  );
  const delivered = familyAlerts.filter((a) => a.deliverAt <= nowIso);
  const open = sortByDateDesc(delivered.filter((a) => a.status === 'פתוחה'), 'createdAt');
  const handled = sortByDateDesc(delivered.filter((a) => a.status !== 'פתוחה'), 'createdAt').slice(0, 10);
  const shabbatBatch = open.filter((a) => a.queuedForShabbat);

  function approve(alert) {
    if (alert.suggestedActionType === 'CREATE_PURCHASE_TASK' || alert.suggestedActionType === 'CREATE_RENEWAL_TASK') {
      upsert('tasks', {
        familyId: alert.familyId, parentId: alert.parentId, title: alert.suggestedAction,
        details: alert.message, category: 'תרופות', urgency: 'גבוה', status: 'חדש', source: 'אוטומציה',
      }, { audit: false });
      notify('נוצרה משימה בעקבות ההצעה');
    } else {
      notify('התודה נרשמה — אפשר להמשיך לטפל במסך הרלוונטי');
    }
    upsert('alerts', { id: alert.id, status: 'טופלה', handledBy: currentUser.displayName, handledAt: new Date().toISOString() }, { note: 'התראה אושרה' });
  }

  function dismiss(alert) {
    upsert('alerts', { id: alert.id, status: 'נדחתה', handledBy: currentUser.displayName, handledAt: new Date().toISOString() }, { note: 'התראה נדחתה' });
  }

  if (delivered.length === 0) {
    return <EmptyState emoji="🔔" title="אין התראות כרגע" text="כשתהיה תזכורת חשובה — תרופה שלא סומנה, מלאי נמוך או תור מתקרב — היא תופיע כאן." />;
  }

  return (
    <div className="stack">
      <h1>התראות</h1>

      {shabbatBatch.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--gold)' }}>
          <h3>🕯️ סיכום מה שהצטבר בשבת</h3>
          <p className="small muted">התראות אלה נוצרו בזמן שבת ולא נשלחו כדי לשמור על מנוחת השבת.</p>
        </div>
      )}

      <h3>פתוחות ({open.length})</h3>
      {open.length === 0 && <p className="muted small">אין התראות פתוחות.</p>}
      {open.map((a) => {
        const meta = alertLevelMeta(a.level);
        return (
          <div className="list-row" key={a.id}>
            <div>
              <div className="tag-row" style={{ marginBottom: 4 }}>
                <Badge tone={meta.cls.replace('badge-', '') === 'badge' ? undefined : meta.cls.replace('badge-', '')}>{meta.icon} {meta.label}</Badge>
                {a.queuedForShabbat && <Badge tone="muted">הצטבר בשבת</Badge>}
              </div>
              <strong>{a.message}</strong>
              {a.reason && <p className="small muted">{a.reason}</p>}
            </div>
            <div className="row">
              {a.suggestedAction && <button className="btn btn-sm btn-primary" onClick={() => approve(a)}>{a.suggestedAction}</button>}
              <button className="btn btn-sm btn-secondary" onClick={() => dismiss(a)}>סימון כטופל</button>
            </div>
          </div>
        );
      })}

      {handled.length > 0 && (
        <>
          <h3>טופלו לאחרונה</h3>
          {handled.map((a) => (
            <div className="list-row" key={a.id} style={{ opacity: 0.7 }}>
              <span className="small">{a.message}</span>
              <Badge tone="muted">{a.status}</Badge>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
