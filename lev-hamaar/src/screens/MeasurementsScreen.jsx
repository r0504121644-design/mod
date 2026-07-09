import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { byParent, sortByDateDesc } from '../lib/store';
import { MEASUREMENT_TYPES } from '../lib/constants';
import { Field, EmptyState, Badge, ConfirmDialog } from '../components/UI';

const NORMAL_RANGES = {
  bp_sys: [90, 180], bp_dia: [50, 110], pulse: [40, 130], sugar: [60, 300],
  spo2: [90, 100], temp: [35, 39], weight: [30, 150], pain: [0, 10], fluids: [0, 4000],
};

export default function MeasurementsScreen() {
  const { entities, currentFamily, currentParent, currentUser, upsert, can, notify } = useApp();
  const [typeKey, setTypeKey] = useState(MEASUREMENT_TYPES[0].key);
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  if (!currentParent) return null;
  const measurements = sortByDateDesc(byParent(entities, 'measurements', currentParent.id), 'createdAt');
  const canEdit = can('measurements');

  function commit() {
    upsert('measurements', {
      familyId: currentFamily.id, parentId: currentParent.id, type: typeKey, value: Number(value),
      recordedBy: currentUser.displayName, note, status: 'תקינה',
    });
    setValue(''); setNote(''); setPending(null);
    notify('המדידה נשמרה');
  }

  function submit(e) {
    e.preventDefault();
    if (!value) return;
    const range = NORMAL_RANGES[typeKey];
    if (range && (Number(value) < range[0] || Number(value) > range[1])) {
      setPending(true);
      return;
    }
    commit();
  }

  function cancelMeasurement(m, reason) {
    upsert('measurements', { id: m.id, status: 'בוטלה', cancelReason: reason }, { note: `מדידה בוטלה: ${reason}` });
    setCancelling(null);
  }

  return (
    <div className="stack">
      <h1>מדדים — {currentParent.nickname}</h1>
      <p className="muted small">האפליקציה אינה מאבחנת מצב רפואי — המדדים מתועדים לצורך מעקב ושיתוף עם גורם מקצועי.</p>

      {canEdit && (
        <form className="card" onSubmit={submit}>
          <div className="grid grid-3">
            <Field label="סוג מדד">
              <select value={typeKey} onChange={(e) => setTypeKey(e.target.value)}>
                {MEASUREMENT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </Field>
            <Field label={`ערך (${MEASUREMENT_TYPES.find((t) => t.key === typeKey)?.unit || ''})`}>
              <input type="number" value={value} onChange={(e) => setValue(e.target.value)} required />
            </Field>
            <Field label="הערה"><input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          </div>
          <button className="btn btn-primary" type="submit">שמירת מדידה</button>
        </form>
      )}

      {measurements.length === 0 ? (
        <EmptyState emoji="📈" title="עדיין אין מדדים" text="מדדים שמתועדים כאן יעזרו לזהות מגמות ולהכין מידע לרופא." />
      ) : (
        <div className="card">
          <table className="data-table">
            <thead><tr><th>תאריך</th><th>סוג</th><th>ערך</th><th>מי הזין</th><th>סטטוס</th></tr></thead>
            <tbody>
              {measurements.map((m) => {
                const t = MEASUREMENT_TYPES.find((x) => x.key === m.type);
                return (
                  <tr key={m.id} style={m.status === 'בוטלה' ? { opacity: 0.5, textDecoration: 'line-through' } : undefined}>
                    <td>{new Date(m.createdAt).toLocaleString('he-IL')}</td>
                    <td>{t?.label}</td>
                    <td>{m.value} {t?.unit}</td>
                    <td>{m.recordedBy}</td>
                    <td>
                      {m.status === 'בוטלה' ? <Badge tone="muted">בוטלה</Badge> : (
                        canEdit && <button className="btn btn-sm btn-ghost" onClick={() => setCancelling(m)}>ביטול</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pending && (
        <ConfirmDialog
          title="ערך חריג"
          message="הערך שהוזן חורג מהטווח הרגיל. לפני השמירה — כדאי לבדוק שוב שהוזן נכון."
          confirmLabel="שמירה בכל זאת"
          onConfirm={commit}
          onCancel={() => setPending(null)}
        />
      )}
      {cancelling && (
        <ConfirmDialog
          title="ביטול מדידה"
          message="המדידה תסומן כמבוטלת ותישמר ביומן הפעילות — לא תימחק בשקט."
          confirmLabel="ביטול המדידה" danger
          onConfirm={() => cancelMeasurement(cancelling, 'בוטל על ידי המשתמש')}
          onCancel={() => setCancelling(null)}
        />
      )}
    </div>
  );
}
