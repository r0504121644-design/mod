import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { byParent } from '../lib/store';
import { BRAND } from '../lib/constants';
import { dateStr } from '../lib/automations';

function withinDays(dateVal, days) {
  const diff = (new Date() - new Date(dateVal)) / 86400000;
  return diff >= 0 && diff <= days;
}

export default function ReportsScreen() {
  const { entities, currentParent } = useApp();
  const [kind, setKind] = useState('weekly');
  const [hideDetails, setHideDetails] = useState(false);
  if (!currentParent) return null;

  const generatedAt = new Date();
  const rangeStart = new Date(); rangeStart.setDate(rangeStart.getDate() - 7);

  const medLogs = Object.values(entities.medicationLogs).filter((l) => l.parentId === currentParent.id && withinDays(l.date, 7));
  const measurements = byParent(entities, 'measurements', currentParent.id).filter((m) => withinDays(m.createdAt, 7) && m.status !== 'בוטלה');
  const visits = byParent(entities, 'visitReports', currentParent.id).filter((v) => withinDays(v.reportedAt, 7));
  const tasks = byParent(entities, 'tasks', currentParent.id).filter((t) => withinDays(t.createdAt, 7));
  const appts = byParent(entities, 'appointments', currentParent.id);
  const upcomingAppt = appts.filter((a) => a.date >= dateStr(new Date())).sort((a, b) => a.date.localeCompare(b.date))[0];
  const nextWeekShifts = byParent(entities, 'shifts', currentParent.id).filter((s) => s.date >= dateStr(new Date()));
  const meds = byParent(entities, 'medications', currentParent.id).filter((m) => m.status !== 'הופסקה');

  const mask = (text) => (hideDetails ? '•••' : text);

  return (
    <div className="stack">
      <div className="section-header">
        <h1>דוחות — {currentParent.nickname}</h1>
        <div className="row">
          <button className={`btn btn-sm ${kind === 'weekly' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setKind('weekly')}>סיכום שבועי</button>
          <button className={`btn btn-sm ${kind === 'doctor' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setKind('doctor')}>הכנה לרופא</button>
          <label className="row small" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={hideDetails} onChange={(e) => setHideDetails(e.target.checked)} /> הסתרת פרטים
          </label>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>הדפסה / שמירה כ-PDF</button>
        </div>
      </div>

      <div className="card" id="report-print-area">
        <h2>{kind === 'weekly' ? 'סיכום שבועי למשפחה' : 'דוח הכנה לרופא'} — {currentParent.nickname}</h2>
        <p className="small muted">
          תאריך הפקה: {generatedAt.toLocaleDateString('he-IL')} · טווח: {rangeStart.toLocaleDateString('he-IL')} — {generatedAt.toLocaleDateString('he-IL')} · מקור הנתונים: לב המעבר (נתונים מתועדים על ידי המשפחה)
        </p>
        <p className="small" style={{ color: 'var(--warning)' }}>דוח זה אינו מסמך רפואי ואינו מהווה תחליף לייעוץ רפואי מקצועי.</p>

        {kind === 'weekly' ? (
          <div className="stack">
            <section>
              <h3>תרופות</h3>
              <p className="small">{medLogs.filter((l) => l.status === 'נלקחה').length} מתוך {medLogs.length} נטילות סומנו כנלקחו השבוע.</p>
            </section>
            <section>
              <h3>מדידות</h3>
              {measurements.length ? <p className="small">{measurements.length} מדידות נרשמו השבוע.</p> : <p className="small muted">לא נרשמו מדידות השבוע.</p>}
            </section>
            <section>
              <h3>ביקורים</h3>
              {visits.length ? visits.map((v) => <p className="small" key={v.id}>{mask(`${v.reportedBy}: ${v.freeText || 'דיווח ללא הערות חופשיות'}`)}</p>) : <p className="small muted">לא תועדו ביקורים השבוע.</p>}
            </section>
            <section>
              <h3>משימות שנפתחו</h3>
              {tasks.length ? <p className="small">{tasks.map((t) => t.title).join(', ')}</p> : <p className="small muted">לא נפתחו משימות חדשות.</p>}
            </section>
            <section>
              <h3>תורנויות לשבוע הקרוב</h3>
              {nextWeekShifts.length ? nextWeekShifts.map((s) => (
                <p className="small" key={s.id}>{s.date} — {s.type} {s.assigneeUserId ? `(${entities.users[s.assigneeUserId]?.displayName})` : '(טרם שובץ)'}</p>
              )) : <p className="small muted">אין תורנויות מתוכננות.</p>}
            </section>
          </div>
        ) : (
          <div className="stack">
            <section>
              <h3>מטרת הפגישה</h3>
              <p className="small">{upcomingAppt ? `${upcomingAppt.type} — ${upcomingAppt.date} ${upcomingAppt.time || ''}` : 'לא נמצא תור קרוב רשום.'}</p>
            </section>
            <section>
              <h3>תרופות פעילות</h3>
              <p className="small">{meds.map((m) => `${m.name}${m.dose ? ` (${m.dose})` : ''}`).join(', ') || 'אין תרופות רשומות.'}</p>
            </section>
            <section>
              <h3>מדידות אחרונות</h3>
              {measurements.length ? measurements.slice(0, 8).map((m) => <p className="small" key={m.id}>{m.type}: {m.value}</p>) : <p className="small muted">אין מדידות בטווח.</p>}
            </section>
            <section>
              <h3>תסמינים שדווחו</h3>
              {visits.length ? visits.map((v) => <p className="small" key={v.id}>{mask(v.answers?.pain || v.answers?.confusion || '—')}</p>) : <p className="small muted">לא דווחו תסמינים.</p>}
            </section>
            <section>
              <h3>שאלות</h3>
              <p className="small">{(upcomingAppt?.questions || []).join('; ') || 'טרם הוכנו שאלות.'}</p>
            </section>
          </div>
        )}

        <p className="credit-line">{BRAND.credit}</p>
      </div>
    </div>
  );
}
