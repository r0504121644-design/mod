import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../lib/hooks.js';
import { formatDateTime, MEETING_TYPE_LABELS } from '../lib/format.js';
import NewMeetingModal from '../components/forms/NewMeetingModal.jsx';

export default function Meetings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const { data: meetings, loading, reload } = useFetch('/meetings');
  const { data: students } = useFetch('/students');

  return (
    <Layout title="פגישות" subtitle={`${meetings?.length ?? ''} פגישות`}>
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <div />
        {(user.role === 'counselor' || user.role === 'teacher') && (
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ פגישה חדשה</button>
        )}
      </div>

      <div className="card">
        {loading && <div className="empty-state">טוענת...</div>}
        {!loading && (meetings || []).length === 0 && <div className="empty-state">אין פגישות</div>}
        {!loading && meetings && meetings.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>תאריך</th><th>סוג</th><th>תלמידה</th><th>מטרה</th><th></th></tr>
              </thead>
              <tbody>
                {meetings.map((m) => (
                  <tr key={m.id} className={m.student_id ? 'clickable' : ''} onClick={() => m.student_id && navigate(`/students/${m.student_id}`)}>
                    <td>{formatDateTime(m.meeting_date)}</td>
                    <td>{MEETING_TYPE_LABELS[m.type]}</td>
                    <td>{m.student_id ? `${m.student_first_name || ''} ${m.student_last_name || ''}`.trim() : '—'}</td>
                    <td>{m.confidential_masked ? <span className="confidential-tag">🔒 חסוי</span> : (m.purpose || '—')}</td>
                    <td>{!!m.confidential && !m.confidential_masked && <span className="badge badge-danger">חסוי</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNew && (
        <NewMeetingModal
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
