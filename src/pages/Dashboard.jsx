import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../lib/hooks.js';
import { fullName, formatDate, formatDateTime, MEETING_TYPE_LABELS, TASK_PRIORITY_LABELS } from '../lib/format.js';
import NewMeetingModal from '../components/forms/NewMeetingModal.jsx';
import NewTaskModal from '../components/forms/NewTaskModal.jsx';
import NewObservationModal from '../components/forms/NewObservationModal.jsx';
import NewCaseModal from '../components/forms/NewCaseModal.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, reload } = useFetch('/dashboard');
  const { data: students } = useFetch('/students');
  const [modal, setModal] = useState(null);
  const navigate = useNavigate();

  if (loading || !data) return <Layout title="היום שלי"><div className="empty-state">טוענת נתונים...</div></Layout>;

  const closeModal = () => setModal(null);
  const onCreated = () => {
    closeModal();
    reload();
  };

  if (user.role === 'counselor') {
    return (
      <Layout title="היום שלי" subtitle={formatDate(new Date().toISOString())}>
        <div className="stat-row">
          <StatCard num={data.meetingsToday.length} label="פגישות היום" />
          <StatCard num={data.tasksToday.length} label="משימות להיום" />
          <StatCard num={data.tasksOverdue.length} label="משימות באיחור" accent="danger" />
          <StatCard num={data.activeCasesCount} label="מקרים פעילים" accent="accent" />
          <StatCard num={data.newReferrals.length} label="פניות חדשות" accent="accent" />
          <StatCard num={data.followUps.length} label="מעקבים" accent="success" />
        </div>

        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-title">פעולות מהירות</div>
          <div className="quick-actions">
            <button className="btn btn-primary" onClick={() => setModal('meeting')}>🗓️ פגישה חדשה</button>
            <button className="btn btn-accent" onClick={() => setModal('task')}>✅ משימה</button>
            <button className="btn btn-outline" onClick={() => setModal('observation')}>👁️ תצפית</button>
            <button className="btn btn-outline" onClick={() => setModal('case')}>📁 פתיחת תיק</button>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-title">פגישות היום</div>
            {data.meetingsToday.length === 0 && <div className="empty-state">אין פגישות מתוזמנות להיום</div>}
            {data.meetingsToday.map((m) => (
              <RowItem key={m.id} title={`${MEETING_TYPE_LABELS[m.type]}${m.first_name ? ' · ' + m.first_name + ' ' + m.last_name : ''}`} sub={formatDateTime(m.meeting_date)} onClick={() => m.student_id && navigate(`/students/${m.student_id}`)} />
            ))}
          </div>

          <div className="card">
            <div className="card-title">משימות להיום ובאיחור</div>
            {[...data.tasksOverdue, ...data.tasksToday].length === 0 && <div className="empty-state">אין משימות פתוחות</div>}
            {data.tasksOverdue.map((t) => (
              <RowItem key={t.id} title={t.title} sub={`באיחור · יעד ${formatDate(t.due_date)}`} badge="danger" badgeText="באיחור" />
            ))}
            {data.tasksToday.map((t) => (
              <RowItem key={t.id} title={t.title} sub={`עדיפות ${TASK_PRIORITY_LABELS[t.priority]}`} />
            ))}
          </div>

          <div className="card">
            <div className="card-title">פניות חדשות ממחנכות</div>
            {data.newReferrals.length === 0 && <div className="empty-state">אין פניות חדשות</div>}
            {data.newReferrals.map((r) => (
              <RowItem key={r.id} title={`${r.first_name} ${r.last_name} · ${r.reason}`} sub={formatDate(r.created_at)} onClick={() => navigate('/referrals')} />
            ))}
          </div>

          <div className="card">
            <div className="card-title">מעקבים פתוחים</div>
            {data.followUps.length === 0 && <div className="empty-state">אין מעקבים פתוחים</div>}
            {data.followUps.map((f) => (
              <RowItem key={f.id} title={f.follow_up} sub={`${f.first_name || ''} ${f.last_name || ''} · ${formatDate(f.meeting_date)}`} onClick={() => f.student_id && navigate(`/students/${f.student_id}`)} />
            ))}
          </div>
        </div>

        {modal === 'meeting' && <NewMeetingModal onClose={closeModal} onCreated={onCreated} students={students || []} />}
        {modal === 'task' && <NewTaskModal onClose={closeModal} onCreated={onCreated} students={students || []} />}
        {modal === 'observation' && <NewObservationModal onClose={closeModal} onCreated={onCreated} students={students || []} />}
        {modal === 'case' && <NewCaseModal onClose={closeModal} onCreated={onCreated} students={students || []} />}
      </Layout>
    );
  }

  if (user.role === 'teacher') {
    return (
      <Layout title="היום שלי" subtitle={formatDate(new Date().toISOString())}>
        <div className="stat-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <StatCard num={data.studentCount} label="תלמידות בכיתה" />
          <StatCard num={data.myTasksToday.length} label="משימות להיום" />
          <StatCard num={data.myTasksOverdue.length} label="משימות באיחור" accent="danger" />
          <StatCard num={data.myReferrals.length} label="הפניות שלי" accent="accent" />
        </div>
        <div className="grid grid-2">
          <div className="card">
            <div className="card-title">משימות שלי</div>
            {[...data.myTasksOverdue, ...data.myTasksToday].length === 0 && <div className="empty-state">אין משימות פתוחות</div>}
            {data.myTasksOverdue.map((t) => <RowItem key={t.id} title={t.title} sub="באיחור" badge="danger" badgeText="באיחור" />)}
            {data.myTasksToday.map((t) => <RowItem key={t.id} title={t.title} sub="להיום" />)}
          </div>
          <div className="card">
            <div className="card-title">הפניות האחרונות שלי</div>
            {data.myReferrals.length === 0 && <div className="empty-state">עדיין לא פתחת פניות</div>}
            {data.myReferrals.slice(0, 6).map((r) => <RowItem key={r.id} title={`${r.first_name} ${r.last_name}`} sub={r.reason} onClick={() => navigate('/referrals')} />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (user.role === 'principal') {
    return (
      <Layout title="תמונת מצב מערכתית" subtitle={formatDate(new Date().toISOString())}>
        <div className="stat-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          <StatCard num={data.studentsCount} label="תלמידות פעילות" />
          <StatCard num={data.activeCases} label="מקרים פעילים" accent="accent" />
          <StatCard num={data.meetingsToday} label="פגישות היום" />
          <StatCard num={data.overdueTasks} label="משימות באיחור" accent="danger" />
          <StatCard num={data.openReferrals} label="פניות חדשות" accent="accent" />
        </div>
        <div className="card">
          <div className="card-title">הרשאות תצוגה</div>
          <p className="muted">כמנהלת בית הספר יש לך תצוגה מערכתית של נתוני הייעוץ, ללא גישה להערות החסויות של היועצת (מסומנות בתג "תוכן חסוי").</p>
        </div>
      </Layout>
    );
  }

  // admin
  return (
    <Layout title="סקירה טכנית" subtitle={formatDate(new Date().toISOString())}>
      <div className="stat-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <StatCard num={data.usersCount} label="משתמשות פעילות" />
        <StatCard num={data.classesCount} label="כיתות" />
      </div>
      <div className="card">
        <div className="card-title">פעילות אחרונה במערכת</div>
        {data.recentAudit.length === 0 && <div className="empty-state">אין פעילות להצגה</div>}
        {data.recentAudit.map((a) => (
          <RowItem key={a.id} title={`${a.user_name || 'מערכת'} · ${a.action} · ${a.entity_type}`} sub={formatDateTime(a.created_at)} />
        ))}
      </div>
      <p className="muted" style={{ marginTop: 14 }}>כ-Admin אין לך גישה אוטומטית לתוכן הייעוצי הרגיש (תיקים, פגישות, תצפיות, תוכניות התערבות).</p>
    </Layout>
  );
}

function StatCard({ num, label, accent }) {
  return (
    <div className={`stat-card${accent ? ' accent-' + accent : ''}`}>
      <div className="num">{num}</div>
      <div className="label">{label}</div>
    </div>
  );
}

function RowItem({ title, sub, onClick, badge, badgeText }) {
  return (
    <div
      className="flex-between"
      style={{ padding: '10px 0', borderBottom: '1px solid var(--border-soft)', cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</div>
        <div className="faint" style={{ fontSize: 12 }}>{sub}</div>
      </div>
      {badge && <span className={`badge badge-${badge}`}>{badgeText}</span>}
    </div>
  );
}
