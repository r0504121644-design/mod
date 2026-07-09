import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { byParent, sortByDateDesc } from '../lib/store';
import { detectEmergency } from '../lib/safety';
import { EmergencyBanner, EmptyState } from '../components/UI';

const QUESTIONS = [
  { key: 'feeling', label: 'איך ההורה הרגיש?' },
  { key: 'ate', label: 'האם אכל/ה?' },
  { key: 'drank', label: 'האם שתה/תה?' },
  { key: 'meds', label: 'האם נלקחו תרופות?' },
  { key: 'pain', label: 'האם היו כאבים?' },
  { key: 'confusion', label: 'האם היה בלבול?' },
  { key: 'fall', label: 'האם הייתה נפילה?' },
  { key: 'measurements', label: 'האם בוצעו מדידות?' },
  { key: 'missing', label: 'האם חסר משהו בבית?' },
  { key: 'updateFamily', label: 'מה חשוב לעדכן את המשפחה?' },
];

export default function VisitReportScreen() {
  const { entities, currentFamily, currentParent, currentUser, upsert, notify } = useApp();
  const [answers, setAnswers] = useState({});
  const [freeText, setFreeText] = useState('');
  const [needsTask, setNeedsTask] = useState(false);
  const [showForm, setShowForm] = useState(false);

  if (!currentParent) return null;
  const reports = sortByDateDesc(byParent(entities, 'visitReports', currentParent.id));
  const emergency = detectEmergency(freeText) || Object.values(answers).some((a) => detectEmergency(a));

  function submit() {
    upsert('visitReports', {
      familyId: currentFamily.id, parentId: currentParent.id, answers, freeText,
      reportedBy: currentUser.displayName, reportedAt: new Date().toISOString(),
    });
    if (needsTask) {
      upsert('tasks', {
        familyId: currentFamily.id, parentId: currentParent.id, title: 'מעקב לאחר ביקור',
        details: freeText || 'נדרש בירור בעקבות דיווח ביקור', category: 'משפחה', urgency: 'רגיל', status: 'חדש', source: 'ידני',
      }, { audit: false });
    }
    setAnswers({}); setFreeText(''); setNeedsTask(false); setShowForm(false);
    notify('דיווח הביקור נשמר, תודה!');
  }

  return (
    <div className="stack">
      <div className="section-header">
        <h1>דיווח ביקור — {currentParent.nickname}</h1>
        {!showForm && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ דיווח ביקור חדש</button>}
      </div>

      {showForm && (
        <div className="card stack">
          {emergency && <EmergencyBanner />}
          {QUESTIONS.map((q) => (
            <div className="field" key={q.key}>
              <label>{q.label}</label>
              <input value={answers[q.key] || ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))} />
            </div>
          ))}
          <div className="field">
            <label>הערות חופשיות</label>
            <textarea value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder="אפשר לכתוב בחופשיות — או להשתמש בהקראה קולית של המכשיר" />
          </div>
          <label className="row small" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={needsTask} onChange={(e) => setNeedsTask(e.target.checked)} /> יש צורך לפתוח משימת מעקב
          </label>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>ביטול</button>
            <button className="btn btn-primary" onClick={submit}>שמירת הדיווח</button>
          </div>
        </div>
      )}

      {reports.length === 0 && !showForm && (
        <EmptyState emoji="📝" title="עדיין לא נשמרו דיווחי ביקור" text="דיווח קצר אחרי כל ביקור עוזר לכל המשפחה להישאר מעודכנת." actionLabel="+ דיווח ביקור" onAction={() => setShowForm(true)} />
      )}

      {reports.map((r) => (
        <div className="card" key={r.id}>
          <div className="section-header">
            <strong>{r.reportedBy}</strong>
            <span className="small muted">{new Date(r.reportedAt).toLocaleString('he-IL')}</span>
          </div>
          {Object.entries(r.answers || {}).filter(([, v]) => v).map(([k, v]) => (
            <p className="small" key={k}><strong>{QUESTIONS.find((q) => q.key === k)?.label}</strong> {v}</p>
          ))}
          {r.freeText && <p className="small">{r.freeText}</p>}
        </div>
      ))}
    </div>
  );
}
