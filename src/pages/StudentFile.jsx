import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../api/client.js';
import { formatDate, formatDateTime, MEETING_TYPE_LABELS, CASE_STATUS_LABELS, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../lib/format.js';
import NewMeetingModal from '../components/forms/NewMeetingModal.jsx';
import NewTaskModal from '../components/forms/NewTaskModal.jsx';
import NewObservationModal from '../components/forms/NewObservationModal.jsx';
import NewCaseModal from '../components/forms/NewCaseModal.jsx';
import Modal from '../components/Modal.jsx';

const TABS_BASE = [
  { key: 'overview', label: 'סקירה' },
  { key: 'timeline', label: 'ציר זמן' },
  { key: 'meetings', label: 'פגישות' },
  { key: 'goals', label: 'מטרות' },
  { key: 'plan', label: 'תוכנית' },
  { key: 'tasks', label: 'משימות' },
  { key: 'observations', label: 'תצפיות' },
  { key: 'documents', label: 'מסמכים' },
];

export default function StudentFile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [modal, setModal] = useState(null);

  const { data: student, loading: studentLoading, error: studentError } = useFetch(`/students/${id}`, [id]);
  const { data: cases, reload: reloadCases } = useFetch(`/cases?studentId=${id}`, [id]);
  const { data: timeline, reload: reloadTimeline } = useFetch(`/timeline?studentId=${id}`, [id]);
  const { data: meetings, reload: reloadMeetings } = useFetch(`/meetings?studentId=${id}`, [id]);
  const { data: plans, reload: reloadPlans } = useFetch(`/plans?studentId=${id}`, [id]);
  const { data: tasks, reload: reloadTasks } = useFetch(`/tasks?studentId=${id}`, [id]);
  const { data: observations, reload: reloadObservations } = useFetch(`/observations?studentId=${id}`, [id]);
  const { data: attachments, reload: reloadAttachments } = useFetch(`/attachments?studentId=${id}`, [id]);

  if (studentLoading) return <Layout title="תיק תלמידה"><div className="empty-state">טוענת...</div></Layout>;
  if (studentError || !student) return <Layout title="תיק תלמידה"><div className="empty-state">אין הרשאה או שהתלמידה לא נמצאה</div></Layout>;

  const isCounselor = user.role === 'counselor';
  const isTeacher = user.role === 'teacher';
  const tabs = TABS_BASE.filter((t) => !(isTeacher && t.key === 'documents'));

  const reloadAll = () => {
    reloadCases(); reloadTimeline(); reloadMeetings(); reloadPlans(); reloadTasks(); reloadObservations(); reloadAttachments();
  };

  const closeModal = () => setModal(null);
  const onCreated = () => { closeModal(); reloadAll(); };

  return (
    <Layout title={`${student.first_name} ${student.last_name}`} subtitle={`כיתה ${student.class_name || '—'}`}>
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/students')}>→ חזרה לתלמידות</button>
        {isCounselor && (
          <div className="quick-actions">
            <button className="btn btn-outline btn-sm" onClick={() => setModal('meeting')}>🗓️ פגישה</button>
            <button className="btn btn-outline btn-sm" onClick={() => setModal('task')}>✅ משימה</button>
            <button className="btn btn-outline btn-sm" onClick={() => setModal('observation')}>👁️ תצפית</button>
            <button className="btn btn-accent btn-sm" onClick={() => setModal('case')}>📁 פתיחת תיק</button>
          </div>
        )}
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <div key={t.key} className={`tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</div>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-2">
          <div className="card">
            <div className="card-title">מידע בסיסי</div>
            <InfoRow label="שם" value={`${student.first_name} ${student.last_name}`} />
            <InfoRow label="כיתה" value={student.class_name || '—'} />
            <InfoRow label="מגדר" value={student.gender || '—'} />
            <InfoRow label="סטטוס" value={student.status === 'active' ? 'פעילה' : 'בארכיון'} />
          </div>
          <div className="card">
            <div className="card-title">חוזקות ומשאבים</div>
            <p className="muted">{student.strengths_resources || 'לא תועד מידע'}</p>
          </div>
          {!isTeacher && (
            <div className="card">
              <div className="card-title">תיקים ייעוציים</div>
              {(cases || []).length === 0 && <div className="empty-state">אין תיקים פתוחים</div>}
              {(cases || []).map((c) => (
                <CaseRow key={c.id} c={c} />
              ))}
            </div>
          )}
          <div className="card">
            <div className="card-title">תוכנית התערבות ומטרות</div>
            {(plans || []).length === 0 && <div className="empty-state">אין תוכנית פעילה</div>}
            {(plans || []).map((p) => (
              <div key={p.id} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.title} <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{p.status === 'active' ? 'פעילה' : 'הושלמה'}</span></div>
                <div className="faint" style={{ fontSize: 12 }}>{(p.goals || []).length} מטרות</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="card">
          <div className="card-title">ציר זמן</div>
          {(timeline || []).length === 0 && <div className="empty-state">אין אירועים עדיין</div>}
          <div className="timeline">
            {(timeline || []).map((ev) => (
              <div className="timeline-item" key={ev.entityType + ev.id}>
                <div className="tl-date">{formatDateTime(ev.date)}</div>
                <div className="tl-title">
                  {ev.title}{' '}
                  {ev.confidential && <span className="confidential-tag">🔒 חסוי</span>}
                </div>
                <div className="tl-summary">{ev.summary}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'meetings' && (
        <div className="card">
          <div className="card-title">פגישות</div>
          {(meetings || []).length === 0 && <div className="empty-state">אין פגישות</div>}
          <div className="table-wrap">
            <table>
              <thead><tr><th>תאריך</th><th>סוג</th><th>מטרה</th><th></th></tr></thead>
              <tbody>
                {(meetings || []).map((m) => (
                  <tr key={m.id}>
                    <td>{formatDateTime(m.meeting_date)}</td>
                    <td>{MEETING_TYPE_LABELS[m.type]}</td>
                    <td>{m.confidential_masked ? <span className="confidential-tag">🔒 חסוי</span> : (m.purpose || '—')}</td>
                    <td>{!!m.confidential && !m.confidential_masked && <span className="badge badge-danger">חסוי</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'goals' && (
        <div className="card">
          <div className="card-title">מטרות</div>
          {(plans || []).flatMap((p) => p.goals || []).length === 0 && <div className="empty-state">אין מטרות מוגדרות</div>}
          {(plans || []).map((p) => (p.goals || []).map((g) => (
            <GoalRow key={g.id} goal={g} planTitle={p.title} editable={isCounselor} onChanged={reloadPlans} />
          )))}
        </div>
      )}

      {tab === 'plan' && (
        <PlanTab studentId={id} plans={plans || []} editable={isCounselor} onChanged={reloadPlans} caseOptions={cases || []} />
      )}

      {tab === 'tasks' && (
        <div className="card">
          <div className="card-title">משימות</div>
          {(tasks || []).length === 0 && <div className="empty-state">אין משימות</div>}
          <div className="table-wrap">
            <table>
              <thead><tr><th>כותרת</th><th>אחראית</th><th>יעד</th><th>עדיפות</th><th>סטטוס</th></tr></thead>
              <tbody>
                {(tasks || []).map((t) => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{t.assignee_name || '—'}</td>
                    <td>{formatDate(t.due_date)}</td>
                    <td>{TASK_PRIORITY_LABELS[t.priority]}</td>
                    <td>
                      <select
                        value={t.status}
                        onChange={async (e) => {
                          await api.put(`/tasks/${t.id}`, { status: e.target.value });
                          reloadTasks();
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
        </div>
      )}

      {tab === 'observations' && (
        <div className="card">
          <div className="card-title">תצפיות</div>
          {(observations || []).length === 0 && <div className="empty-state">אין תצפיות</div>}
          {(observations || []).map((o) => (
            <div key={o.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <div className="flex-between">
                <span className="faint" style={{ fontSize: 12 }}>{formatDate(o.observation_date)}</span>
                {o.confidential_masked ? <span className="confidential-tag">🔒 חסוי</span> : null}
              </div>
              <p style={{ fontSize: 13.5, marginTop: 4 }}>{o.confidential_masked ? 'תוכן חסוי ליועצת' : o.content}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'documents' && (
        <DocumentsTab attachments={attachments || []} studentId={id} editable={isCounselor} onChanged={reloadAttachments} />
      )}

      {modal === 'meeting' && <NewMeetingModal onClose={closeModal} onCreated={onCreated} presetStudentId={id} />}
      {modal === 'task' && <NewTaskModal onClose={closeModal} onCreated={onCreated} presetStudentId={id} />}
      {modal === 'observation' && <NewObservationModal onClose={closeModal} onCreated={onCreated} presetStudentId={id} />}
      {modal === 'case' && <NewCaseModal onClose={closeModal} onCreated={onCreated} presetStudentId={id} />}
    </Layout>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex-between" style={{ padding: '7px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <span className="faint" style={{ fontSize: 12.5 }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function CaseRow({ c }) {
  return (
    <div style={{ padding: '9px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <div className="flex-between">
        <strong style={{ fontSize: 13.5 }}>{c.title}</strong>
        <span className="badge badge-info">{CASE_STATUS_LABELS[c.status]}</span>
      </div>
      <div className="faint" style={{ fontSize: 12 }}>נפתח {formatDate(c.opened_at)}</div>
      {c.confidential_masked ? <span className="confidential-tag">🔒 תקציר חסוי</span> : <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{c.summary}</p>}
    </div>
  );
}

function GoalRow({ goal, planTitle, editable, onChanged }) {
  return (
    <div className="flex-between" style={{ padding: '9px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <div>
        <div style={{ fontSize: 13.5 }}>{goal.description}</div>
        <div className="faint" style={{ fontSize: 11.5 }}>{planTitle}{goal.target_date ? ' · יעד ' + formatDate(goal.target_date) : ''}</div>
      </div>
      {editable ? (
        <select
          value={goal.status}
          onChange={async (e) => {
            await api.put(`/plans/goals/${goal.id}`, { status: e.target.value });
            onChanged();
          }}
        >
          <option value="open">פתוחה</option>
          <option value="in_progress">בתהליך</option>
          <option value="achieved">הושגה</option>
        </select>
      ) : (
        <span className={`badge ${goal.status === 'achieved' ? 'badge-success' : 'badge-neutral'}`}>
          {goal.status === 'achieved' ? 'הושגה' : goal.status === 'in_progress' ? 'בתהליך' : 'פתוחה'}
        </span>
      )}
    </div>
  );
}

function PlanTab({ studentId, plans, editable, onChanged, caseOptions }) {
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [goalTargetPlan, setGoalTargetPlan] = useState(null);

  return (
    <div>
      {editable && (
        <div style={{ marginBottom: 14 }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewPlan(true)}>+ תוכנית התערבות חדשה</button>
        </div>
      )}
      {plans.length === 0 && <div className="card"><div className="empty-state">אין תוכנית התערבות</div></div>}
      {plans.map((p) => (
        <div className="card" key={p.id} style={{ marginBottom: 14 }}>
          <div className="flex-between">
            <div className="card-title" style={{ marginBottom: 4 }}>{p.title}</div>
            <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{p.status === 'active' ? 'פעילה' : 'הושלמה'}</span>
          </div>
          <div className="faint" style={{ fontSize: 12, marginBottom: 10 }}>
            {p.start_date ? `התחלה ${formatDate(p.start_date)}` : ''}{p.end_date ? ` · סיום ${formatDate(p.end_date)}` : ''}
          </div>
          {(p.goals || []).map((g) => (
            <GoalRow key={g.id} goal={g} planTitle="" editable={editable} onChanged={onChanged} />
          ))}
          {editable && (
            <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }} onClick={() => setGoalTargetPlan(p.id)}>+ הוספת מטרה</button>
          )}
        </div>
      ))}

      {showNewPlan && (
        <NewPlanModal
          studentId={studentId}
          caseOptions={caseOptions}
          onClose={() => setShowNewPlan(false)}
          onCreated={() => { setShowNewPlan(false); onChanged(); }}
        />
      )}
      {goalTargetPlan && (
        <NewGoalModal
          planId={goalTargetPlan}
          onClose={() => setGoalTargetPlan(null)}
          onCreated={() => { setGoalTargetPlan(null); onChanged(); }}
        />
      )}
    </div>
  );
}

function NewPlanModal({ studentId, caseOptions, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', caseId: caseOptions[0]?.id || '', startDate: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/plans', { ...form, studentId });
      onCreated();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <Modal title="תוכנית התערבות חדשה" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="login-error">{error}</div>}
        <div className="field"><label>כותרת</label><input value={form.title} onChange={set('title')} required /></div>
        <div className="field"><label>תאריך התחלה</label><input type="date" value={form.startDate} onChange={set('startDate')} /></div>
        <div className="modal-actions">
          <button className="btn btn-primary">שמירה</button>
          <button type="button" className="btn btn-outline" onClick={onClose}>ביטול</button>
        </div>
      </form>
    </Modal>
  );
}

function NewGoalModal({ planId, onClose, onCreated }) {
  const [form, setForm] = useState({ description: '', targetDate: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/plans/${planId}/goals`, form);
      onCreated();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <Modal title="מטרה חדשה" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="login-error">{error}</div>}
        <div className="field"><label>תיאור המטרה</label><textarea value={form.description} onChange={set('description')} required /></div>
        <div className="field"><label>תאריך יעד</label><input type="date" value={form.targetDate} onChange={set('targetDate')} /></div>
        <div className="modal-actions">
          <button className="btn btn-primary">שמירה</button>
          <button type="button" className="btn btn-outline" onClick={onClose}>ביטול</button>
        </div>
      </form>
    </Modal>
  );
}

function DocumentsTab({ attachments, studentId, editable, onChanged }) {
  const [showNew, setShowNew] = useState(false);
  return (
    <div className="card">
      <div className="flex-between" style={{ marginBottom: 10 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>מסמכים</div>
        {editable && <button className="btn btn-outline btn-sm" onClick={() => setShowNew(true)}>+ הוספת מסמך</button>}
      </div>
      {attachments.length === 0 && <div className="empty-state">אין מסמכים מצורפים</div>}
      {attachments.map((a) => (
        <div key={a.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--border-soft)' }}>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>📎 {a.title}</div>
          <div className="faint" style={{ fontSize: 12 }}>{a.note}</div>
        </div>
      ))}
      {showNew && (
        <NewAttachmentModal
          studentId={studentId}
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); onChanged(); }}
        />
      )}
    </div>
  );
}

function NewAttachmentModal({ studentId, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', note: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/attachments', { ...form, studentId });
      onCreated();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <Modal title="הוספת מסמך" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="login-error">{error}</div>}
        <div className="field"><label>כותרת המסמך</label><input value={form.title} onChange={set('title')} required /></div>
        <div className="field"><label>הערה</label><textarea value={form.note} onChange={set('note')} /></div>
        <div className="modal-actions">
          <button className="btn btn-primary">שמירה</button>
          <button type="button" className="btn btn-outline" onClick={onClose}>ביטול</button>
        </div>
      </form>
    </Modal>
  );
}
