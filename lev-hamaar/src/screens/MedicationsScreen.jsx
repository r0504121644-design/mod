import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { byParent } from '../lib/store';
import { dateStr } from '../lib/automations';
import { MED_LOG_STATUS, VERIFICATION_METHODS } from '../lib/constants';
import { Modal, Field, Badge, EmptyState } from '../components/UI';

const emptyMed = { name: '', dose: '', frequency: 'קבועה', times: '08:00', isPRN: false, form: '', doctor: '', needsPrescription: false, renewalDate: '', instructions: '', sensitivities: '', notes: '' };

export default function MedicationsScreen() {
  const { entities, currentFamily, currentParent, upsert, can, currentUser, notify } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [logNote, setLogNote] = useState({});

  if (!currentParent) return null;
  const meds = byParent(entities, 'medications', currentParent.id).filter((m) => m.status !== 'הופסקה');
  const ds = dateStr(new Date());
  const canEditMeds = can('medications');

  function saveMed(data) {
    const med = upsert('medications', {
      ...data,
      id: editing?.id,
      familyId: currentFamily.id,
      parentId: currentParent.id,
      times: typeof data.times === 'string' ? data.times.split(',').map((t) => t.trim()).filter(Boolean) : data.times,
      status: 'פעיל',
      lastUpdateSource: editing ? 'עודכן ידנית' : 'עודכן ידנית',
      certainty: 'ודאי',
    });
    if (!editing) {
      upsert('inventory', { familyId: currentFamily.id, parentId: currentParent.id, medicationId: med.id, quantity: 20, thresholdAlert: 5 }, { audit: false });
    }
    setShowAdd(false);
    setEditing(null);
    notify('התרופה נשמרה ברשימה הפעילה');
  }

  function markLog(medId, status) {
    const logId = `medlog_${medId}_${ds}_manual_${Date.now()}`;
    const existing = Object.values(entities.medicationLogs).find((l) => l.medicationId === medId && l.date === ds && !l.scheduledTime);
    upsert('medicationLogs', {
      id: existing?.id || logId, familyId: currentFamily.id, parentId: currentParent.id, medicationId: medId,
      date: ds, scheduledTime: existing?.scheduledTime || 'לפי צורך', status,
      markedBy: currentUser.displayName, markedAt: new Date().toISOString(),
      verification: logNote[medId] || 'לא ידוע בוודאות',
    }, { note: `נטילה לפי-צורך סומנה: ${status}` });
    notify('הנטילה נרשמה');
  }

  function updateScheduledLog(log, status) {
    upsert('medicationLogs', {
      id: log.id, status, markedBy: currentUser.displayName, markedAt: new Date().toISOString(),
      verification: logNote[log.id] || 'לא ידוע בוודאות',
    }, { note: `סטטוס נטילה עודכן ל-${status}` });
  }

  function updateInventory(inv, patch, note) {
    upsert('inventory', { id: inv.id, ...patch, lastUpdatedBy: currentUser.displayName, lastUpdatedAt: new Date().toISOString() }, { note });
  }

  if (meds.length === 0) {
    return (
      <EmptyState
        emoji="💊"
        title="עדיין לא נוספו תרופות"
        text={`רשימת התרופות הפעילה של ${currentParent.nickname} תוצג כאן, ותשמש בסיס לתזכורות, למלאי ולדוחות.`}
        actionLabel="+ הוספת תרופה ראשונה"
        onAction={() => setShowAdd(true)}
      />
    );
  }

  return (
    <div className="stack">
      <div className="section-header">
        <h1>תרופות ומלאי — {currentParent.nickname}</h1>
        {canEditMeds && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ תרופה חדשה</button>}
      </div>
      <p className="muted small">הרשימה הפעילה כאן היא מקור המידע התפעולי של המשפחה במערכת. היא אינה מחליפה רשומה רפואית, מרשם או הוראת רופא.</p>

      {meds.map((med) => {
        const inv = Object.values(entities.inventory).find((i) => i.medicationId === med.id);
        const todayLogs = Object.values(entities.medicationLogs).filter((l) => l.medicationId === med.id && l.date === ds);
        return (
          <div className="card" key={med.id}>
            <div className="section-header">
              <div>
                <h3 style={{ marginBottom: 2 }}>{med.name} {med.dose && <span className="muted small">· {med.dose}</span>}</h3>
                <div className="tag-row">
                  <Badge>{med.isPRN ? 'לפי צורך' : 'קבועה'}</Badge>
                  {med.doctor && <Badge tone="muted">ד״ר {med.doctor}</Badge>}
                  {med.needsPrescription && <Badge tone="warning">נדרש מרשם</Badge>}
                </div>
              </div>
              {canEditMeds && <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(med); setShowAdd(true); }}>עריכה</button>}
            </div>

            {med.instructions && <p className="small">הוראות: {med.instructions}</p>}

            {!med.isPRN && (
              <div className="stack">
                <strong className="small">נטילות היום</strong>
                {todayLogs.length === 0 && <p className="small muted">אין נטילות מתוכננות היום.</p>}
                {todayLogs.map((log) => (
                  <div className="list-row" key={log.id}>
                    <span>{log.scheduledTime} — {log.status}{log.markedBy ? ` (${log.markedBy})` : ''}</span>
                    {canEditMeds && log.status === 'טרם סומנה' && (
                      <div className="row">
                        <select value={logNote[log.id] || ''} onChange={(e) => setLogNote((s) => ({ ...s, [log.id]: e.target.value }))} className="btn-sm">
                          <option value="">אופן אימות...</option>
                          {VERIFICATION_METHODS.map((v) => <option key={v}>{v}</option>)}
                        </select>
                        <button className="btn btn-sm btn-primary" onClick={() => updateScheduledLog(log, MED_LOG_STATUS.TAKEN)}>נלקחה</button>
                        <button className="btn btn-sm btn-secondary" onClick={() => updateScheduledLog(log, MED_LOG_STATUS.SKIPPED)}>נדחתה</button>
                        <button className="btn btn-sm btn-danger" onClick={() => updateScheduledLog(log, MED_LOG_STATUS.MISSED)}>לא נלקחה</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {med.isPRN && canEditMeds && (
              <div className="row">
                <button className="btn btn-sm btn-primary" onClick={() => markLog(med.id, MED_LOG_STATUS.TAKEN)}>תיעוד נטילה לפי צורך</button>
              </div>
            )}

            {inv && (
              <div className="list-row" style={{ marginTop: 10, background: 'var(--blue-pale)' }}>
                <span>מלאי: <strong>{inv.quantity}</strong> יחידות (סף התראה: {inv.thresholdAlert})</span>
                {canEditMeds && (
                  <div className="row">
                    <button className="btn btn-sm btn-secondary" onClick={() => updateInventory(inv, { quantity: Math.max(0, inv.quantity - 1) }, 'מלאי עודכן: -1')}>נרכשה יחידה −</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => updateInventory(inv, { quantity: inv.quantity + 20 }, 'מלאי עודכן: נרכש מלאי חדש')}>נרכש מלאי חדש (+20)</button>
                    <button className="btn btn-sm btn-danger" onClick={() => updateInventory(inv, { quantity: 0 }, 'סומן: מלאי חסר')}>חסרה</button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {showAdd && (
        <MedForm
          initial={editing || emptyMed}
          onCancel={() => { setShowAdd(false); setEditing(null); }}
          onSave={saveMed}
        />
      )}
    </div>
  );
}

function MedForm({ initial, onCancel, onSave }) {
  const [data, setData] = useState({ ...initial, times: Array.isArray(initial.times) ? initial.times.join(',') : initial.times });
  const set = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  return (
    <Modal title={initial.name ? 'עריכת תרופה' : 'תרופה חדשה'} onClose={onCancel} wide>
      <div className="grid grid-2">
        <Field label="שם התרופה"><input value={data.name} onChange={set('name')} /></Field>
        <Field label="מינון"><input value={data.dose} onChange={set('dose')} /></Field>
        <Field label="צורת מתן"><input value={data.form} onChange={set('form')} placeholder="כדור, טיפות, זריקה..." /></Field>
        <Field label="שעות נטילה (מופרדות בפסיק)"><input value={data.times} onChange={set('times')} placeholder="08:00,20:00" /></Field>
        <Field label="רופא מטפל"><input value={data.doctor} onChange={set('doctor')} /></Field>
        <Field label="תאריך חידוש מרשם"><input type="date" value={data.renewalDate} onChange={set('renewalDate')} /></Field>
      </div>
      <label className="row small" style={{ cursor: 'pointer' }}>
        <input type="checkbox" checked={!!data.isPRN} onChange={set('isPRN')} /> תרופה לפי צורך (לא קבועה)
      </label>
      <label className="row small" style={{ cursor: 'pointer' }}>
        <input type="checkbox" checked={!!data.needsPrescription} onChange={set('needsPrescription')} /> נדרש מרשם לחידוש
      </label>
      <Field label="הוראות מקצועיות" hint="כפי שנמסרו על ידי גורם מקצועי — לא ניתן לשנות מינון או להמליץ להפסיק תרופה דרך המערכת.">
        <textarea value={data.instructions} onChange={set('instructions')} />
      </Field>
      <Field label="רגישויות רלוונטיות"><input value={data.sensitivities} onChange={set('sensitivities')} /></Field>
      <Field label="הערות"><textarea value={data.notes} onChange={set('notes')} /></Field>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onCancel}>ביטול</button>
        <button className="btn btn-primary" onClick={() => onSave(data)}>שמירה</button>
      </div>
    </Modal>
  );
}
