import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { byParent, list, sortByDateAsc } from '../lib/store';
import { SHIFT_TYPES } from '../lib/constants';
import { Modal, Field, EmptyState, Badge } from '../components/UI';

const empty = { type: SHIFT_TYPES[0], date: '', startTime: '', endTime: '' };

export default function ShiftsScreen() {
  const { entities, currentFamily, currentParent, currentUser, upsert, can, notify } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  if (!currentParent) return null;

  const shifts = sortByDateAsc(byParent(entities, 'shifts', currentParent.id), 'date');
  const canEditShifts = can('shifts');
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = shifts.filter((s) => s.date >= today && s.status !== 'בוטלה');
  const members = list(entities, 'memberships').filter((m) => m.familyId === currentFamily.id && m.status === 'פעיל');

  function save(data) {
    upsert('shifts', { ...data, familyId: currentFamily.id, parentId: currentParent.id, status: 'פנויה' });
    setShowAdd(false);
    notify('התורנות נוספה ללוח');
  }

  function volunteer(shift) {
    upsert('shifts', { id: shift.id, assigneeUserId: currentUser.id, status: 'משובצת' }, { note: 'התנדבות לתורנות' });
    notify('נרשמת לתורנות, תודה!');
  }

  function confirmArrival(shift) {
    upsert('shifts', { id: shift.id, status: 'אושרה' }, { note: 'אישור הגעה לתורנות' });
  }

  function cancelShift(shift) {
    upsert('shifts', { id: shift.id, status: 'בוטלה' }, { note: 'תורנות בוטלה' });
  }

  if (shifts.length === 0) {
    return <EmptyState emoji="📅" title="עדיין לא נקבעו תורנויות" text="תיאום מראש מקל על כולם ומונע הפתעות." actionLabel="+ קביעת תורנות ראשונה" onAction={() => setShowAdd(true)} />;
  }

  return (
    <div className="stack">
      <div className="section-header">
        <h1>תורנויות — {currentParent.nickname}</h1>
        {canEditShifts && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ תורנות חדשה</button>}
      </div>
      {upcoming.map((s) => {
        const assignee = s.assigneeUserId ? entities.users[s.assigneeUserId] : null;
        return (
          <div className="list-row" key={s.id}>
            <div>
              <strong>{s.type}</strong> <span className="small muted">{s.date} {s.startTime}-{s.endTime}</span>
              <div className="tag-row" style={{ marginTop: 4 }}>
                {assignee ? <Badge tone="success">{assignee.displayName}</Badge> : <Badge tone="warning">פנויה — מחפשים מתנדב</Badge>}
                <Badge tone="muted">{s.status}</Badge>
              </div>
            </div>
            <div className="row">
              {!s.assigneeUserId && <button className="btn btn-sm btn-primary" onClick={() => volunteer(s)}>אני יכול/ה!</button>}
              {s.assigneeUserId && s.status === 'משובצת' && <button className="btn btn-sm btn-secondary" onClick={() => confirmArrival(s)}>אישור הגעה</button>}
              {canEditShifts && <button className="btn btn-sm btn-ghost" onClick={() => cancelShift(s)}>ביטול</button>}
            </div>
          </div>
        );
      })}
      {showAdd && <ShiftForm initial={empty} onCancel={() => setShowAdd(false)} onSave={save} />}
    </div>
  );
}

function ShiftForm({ initial, onCancel, onSave }) {
  const [data, setData] = useState(initial);
  const set = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.value }));
  return (
    <Modal title="תורנות חדשה" onClose={onCancel}>
      <Field label="סוג תורנות"><select value={data.type} onChange={set('type')}>{SHIFT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="תאריך"><input type="date" value={data.date} onChange={set('date')} /></Field>
      <div className="grid grid-2">
        <Field label="משעה"><input type="time" value={data.startTime} onChange={set('startTime')} /></Field>
        <Field label="עד שעה"><input type="time" value={data.endTime} onChange={set('endTime')} /></Field>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onCancel}>ביטול</button>
        <button className="btn btn-primary" onClick={() => onSave(data)}>שמירה</button>
      </div>
    </Modal>
  );
}
