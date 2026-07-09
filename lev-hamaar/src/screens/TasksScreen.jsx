import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { byParent, list } from '../lib/store';
import { TASK_CATEGORIES, TASK_STATUSES, TASK_URGENCY, TASK_SOURCES } from '../lib/constants';
import { Modal, Field, EmptyState, Badge } from '../components/UI';

const empty = { title: '', details: '', category: TASK_CATEGORIES[0], urgency: 'רגיל', dueDate: '', assigneeUserId: '' };

export default function TasksScreen() {
  const { entities, currentFamily, currentParent, upsert, can, notify } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('הכל');
  if (!currentParent) return null;

  const tasks = byParent(entities, 'tasks', currentParent.id);
  const visible = filter === 'הכל' ? tasks : tasks.filter((t) => t.status === filter);
  const canEditTasks = can('tasks');
  const members = list(entities, 'memberships').filter((m) => m.familyId === currentFamily.id && m.status === 'פעיל');

  function save(data) {
    upsert('tasks', {
      ...data, familyId: currentFamily.id, parentId: currentParent.id, status: data.status || 'חדש', source: TASK_SOURCES.MANUAL,
    });
    setShowAdd(false);
    notify('המשימה נשמרה');
  }

  function setStatus(task, status) {
    upsert('tasks', { id: task.id, status }, { note: `סטטוס משימה עודכן ל-${status}` });
  }

  if (tasks.length === 0) {
    return <EmptyState emoji="✅" title="אין עדיין משימות" text="משימות עוזרות לחלק אחריות בין בני המשפחה ולוודא שכלום לא נופל בין הכיסאות." actionLabel="+ משימה ראשונה" onAction={() => setShowAdd(true)} />;
  }

  return (
    <div className="stack">
      <div className="section-header">
        <h1>משימות — {currentParent.nickname}</h1>
        {canEditTasks && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ משימה חדשה</button>}
      </div>
      <div className="row">
        {['הכל', ...TASK_STATUSES].map((s) => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>
      {visible.map((t) => {
        const assignee = members.find((m) => m.userId === t.assigneeUserId);
        return (
          <div className="list-row" key={t.id}>
            <div>
              <strong>{t.title}</strong>{' '}
              <span className="small muted">{t.category} · {t.dueDate || 'ללא תאריך יעד'} {assignee ? `· ${entities.users[assignee.userId]?.displayName}` : ''}</span>
              {t.source !== 'ידני' && <Badge tone="muted">{t.source}</Badge>}
              {t.urgency === 'דחוף' && <Badge tone="danger">דחוף</Badge>}
            </div>
            {canEditTasks && (
              <select value={t.status} onChange={(e) => setStatus(t, e.target.value)}>
                {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            )}
          </div>
        );
      })}
      {showAdd && <TaskForm initial={empty} members={members} entities={entities} onCancel={() => setShowAdd(false)} onSave={save} />}
    </div>
  );
}

function TaskForm({ initial, members, entities, onCancel, onSave }) {
  const [data, setData] = useState(initial);
  const set = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.value }));
  return (
    <Modal title="משימה חדשה" onClose={onCancel} wide>
      <Field label="כותרת"><input value={data.title} onChange={set('title')} /></Field>
      <Field label="פירוט"><textarea value={data.details} onChange={set('details')} /></Field>
      <div className="grid grid-2">
        <Field label="קטגוריה"><select value={data.category} onChange={set('category')}>{TASK_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="דחיפות"><select value={data.urgency} onChange={set('urgency')}>{TASK_URGENCY.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="תאריך יעד"><input type="date" value={data.dueDate} onChange={set('dueDate')} /></Field>
        <Field label="אחראי">
          <select value={data.assigneeUserId} onChange={set('assigneeUserId')}>
            <option value="">לא שובץ</option>
            {members.map((m) => <option key={m.userId} value={m.userId}>{entities.users[m.userId]?.displayName}</option>)}
          </select>
        </Field>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onCancel}>ביטול</button>
        <button className="btn btn-primary" onClick={() => onSave(data)}>שמירה</button>
      </div>
    </Modal>
  );
}
