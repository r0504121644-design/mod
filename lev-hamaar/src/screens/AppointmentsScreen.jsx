import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { byParent } from '../lib/store';
import { Modal, Field, EmptyState, Badge } from '../components/UI';

const empty = { type: '', date: '', time: '', clinic: '', address: '', contact: '', escort: '', preparation: '', questions: '', summary: '' };

export default function AppointmentsScreen() {
  const { entities, currentFamily, currentParent, upsert, can, notify } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  if (!currentParent) return null;

  const appts = byParent(entities, 'appointments', currentParent.id).sort((a, b) => a.date.localeCompare(b.date));
  const canEditAppts = can('appointments');

  function save(data) {
    upsert('appointments', {
      ...data,
      id: editing?.id,
      familyId: currentFamily.id,
      parentId: currentParent.id,
      questions: typeof data.questions === 'string' ? data.questions.split('\n').filter(Boolean) : data.questions,
    });
    setShowAdd(false); setEditing(null);
    notify('התור נשמר');
  }

  if (appts.length === 0) {
    return (
      <EmptyState emoji="🩺" title="אין עדיין תורים רשומים" text="הוספת תור מאפשרת תזכורות, שיבוץ מלווה ותיעוד לאחר הפגישה." actionLabel="+ הוספת תור" onAction={() => setShowAdd(true)} />
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="stack">
      <div className="section-header">
        <h1>תורים ובדיקות — {currentParent.nickname}</h1>
        {canEditAppts && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ הוספת תור</button>}
      </div>
      {appts.map((a) => (
        <div className="card" key={a.id}>
          <div className="section-header">
            <div>
              <h3 style={{ marginBottom: 2 }}>{a.type}</h3>
              <div className="tag-row">
                <Badge tone={a.date < today ? 'muted' : 'success'}>{a.date} {a.time}</Badge>
                {a.clinic && <Badge tone="muted">{a.clinic}</Badge>}
                {a.escort ? <Badge>מלווה: {a.escort}</Badge> : <Badge tone="warning">טרם שובץ מלווה</Badge>}
              </div>
            </div>
            {canEditAppts && <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(a); setShowAdd(true); }}>עריכה</button>}
          </div>
          {a.preparation && <p className="small">הכנה נדרשת: {a.preparation}</p>}
          {a.questions?.length > 0 && (
            <div className="small">
              <strong>שאלות לרופא:</strong>
              <ul>{a.questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
            </div>
          )}
          {a.summary && <p className="small"><strong>סיכום לאחר התור:</strong> {a.summary}</p>}
        </div>
      ))}
      {showAdd && <ApptForm initial={editing || empty} onCancel={() => { setShowAdd(false); setEditing(null); }} onSave={save} />}
    </div>
  );
}

function ApptForm({ initial, onCancel, onSave }) {
  const [data, setData] = useState({ ...initial, questions: Array.isArray(initial.questions) ? initial.questions.join('\n') : initial.questions });
  const set = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.value }));
  return (
    <Modal title={initial.type ? 'עריכת תור' : 'תור חדש'} onClose={onCancel} wide>
      <div className="grid grid-2">
        <Field label="סוג התור"><input value={data.type} onChange={set('type')} /></Field>
        <Field label="תאריך"><input type="date" value={data.date} onChange={set('date')} /></Field>
        <Field label="שעה"><input type="time" value={data.time} onChange={set('time')} /></Field>
        <Field label="מרפאה"><input value={data.clinic} onChange={set('clinic')} /></Field>
        <Field label="כתובת"><input value={data.address} onChange={set('address')} /></Field>
        <Field label="איש קשר"><input value={data.contact} onChange={set('contact')} /></Field>
        <Field label="מלווה משובץ"><input value={data.escort} onChange={set('escort')} /></Field>
      </div>
      <Field label="הכנה נדרשת"><input value={data.preparation} onChange={set('preparation')} /></Field>
      <Field label="שאלות לרופא (שורה לכל שאלה)"><textarea value={data.questions} onChange={set('questions')} /></Field>
      <Field label="סיכום לאחר התור"><textarea value={data.summary} onChange={set('summary')} /></Field>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onCancel}>ביטול</button>
        <button className="btn btn-primary" onClick={() => onSave(data)}>שמירה</button>
      </div>
    </Modal>
  );
}
