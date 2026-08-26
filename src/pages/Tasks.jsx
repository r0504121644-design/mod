import React, { useState } from 'react';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../api/client.js';
import { formatDate, TASK_PRIORITY_LABELS } from '../lib/format.js';
import NewTaskModal from '../components/forms/NewTaskModal.jsx';

const VIEWS = [
  { key: 'today', label: 'היום' },
  { key: 'week', label: 'השבוע' },
  { key: 'overdue', label: 'באיחור' },
  { key: 'upcoming', label: 'בהמשך' },
  { key: 'done', label: 'הושלם' },
];

export default function Tasks() {
  const { user } = useAuth();
  const [view, setView] = useState('today');
  const [showNew, setShowNew] = useState(false);
  const { data: tasks, loading, reload } = useFetch(`/tasks?view=${view}`, [view]);
  const { data: students } = useFetch('/students');

  return (
    <Layout title="משימות" subtitle={`${tasks?.length ?? ''} משימות בתצוגה`}>
      <div className="flex-between" style={{ marginBottom: 14 }}>
        <div className="tabs" style={{ marginBottom: 0, border: 'none' }}>
          {VIEWS.map((v) => (
            <div key={v.key} className={`tab${view === v.key ? ' active' : ''}`} onClick={() => setView(v.key)}>{v.label}</div>
          ))}
        </div>
        {user.role === 'counselor' && (
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ משימה חדשה</button>
        )}
      </div>

      <div className="card">
        {loading && <div className="empty-state">טוענת...</div>}
        {!loading && (tasks || []).length === 0 && <div className="empty-state">אין משימות בתצוגה זו</div>}
        {!loading && tasks && tasks.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>כותרת</th><th>תלמידה</th><th>אחראית</th><th>יעד</th><th>עדיפות</th><th>סטטוס</th></tr></thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{t.student_first_name ? `${t.student_first_name} ${t.student_last_name}` : '—'}</td>
                    <td>{t.assignee_name || '—'}</td>
                    <td>{formatDate(t.due_date)}</td>
                    <td>{TASK_PRIORITY_LABELS[t.priority]}</td>
                    <td>
                      <select
                        value={t.status}
                        onChange={async (e) => {
                          await api.put(`/tasks/${t.id}`, { status: e.target.value });
                          reload();
                        }}
                      >
                        <option value="todo">לביצוע</option>
                        <option value="in_progress">בתהליך</option>
                        <option value="done">הושלם</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNew && (
        <NewTaskModal
          students={students || []}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            reload();
          }}
        />
      )}
    </Layout>
  );
}
