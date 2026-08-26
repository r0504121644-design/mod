import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../api/client.js';
import { formatDate, REFERRAL_STATUS_LABELS } from '../lib/format.js';
import NewCaseModal from '../components/forms/NewCaseModal.jsx';

export default function Referrals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [caseForReferral, setCaseForReferral] = useState(null);
  const { data: referrals, loading, reload } = useFetch('/referrals');
  const { data: students } = useFetch('/students');

  const statusBadge = (s) => ({ new: 'badge-danger', in_review: 'badge-warning', handled: 'badge-success' }[s] || 'badge-neutral');

  return (
    <Layout title={user.role === 'teacher' ? 'הפניות שלי' : 'פניות מחנכות'} subtitle={`${referrals?.length ?? ''} פניות`}>
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <div />
        {user.role === 'teacher' && (
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ פנייה חדשה</button>
        )}
      </div>

      <div className="card">
        {loading && <div className="empty-state">טוענת...</div>}
        {!loading && (referrals || []).length === 0 && <div className="empty-state">אין פניות</div>}
        {!loading && referrals && referrals.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>תלמידה</th><th>סיבה</th><th>נפתחה ע"י</th><th>תאריך</th><th>סטטוס</th>{user.role === 'counselor' && <th></th>}</tr></thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} className="clickable" onClick={() => navigate(`/students/${r.student_id}`)}>
                    <td>{r.student_first_name} {r.student_last_name}</td>
                    <td>{r.reason}</td>
                    <td>{r.referred_by_name || '—'}</td>
                    <td>{formatDate(r.created_at)}</td>
                    <td><span className={`badge ${statusBadge(r.status)}`}>{REFERRAL_STATUS_LABELS[r.status]}</span></td>
                    {user.role === 'counselor' && (
                      <td onClick={(e) => e.stopPropagation()}>
                        {r.status !== 'handled' ? (
                          <button className="btn btn-accent btn-sm" onClick={() => setCaseForReferral(r)}>פתיחת תיק</button>
                        ) : (
                          <span className="faint">טופלה</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNew && (
        <NewReferralModal
          students={students || []}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            reload();
          }}
        />
      )}

      {caseForReferral && (
        <NewCaseModal
          presetStudentId={caseForReferral.student_id}
          referralId={caseForReferral.id}
          onClose={() => setCaseForReferral(null)}
          onCreated={() => {
            setCaseForReferral(null);
            reload();
          }}
        />
      )}
    </Layout>
  );
}

function NewReferralModal({ students, onClose, onCreated }) {
  const [form, setForm] = useState({ studentId: '', reason: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/referrals', form);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="פנייה חדשה ליועצת" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="login-error">{error}</div>}
        <div className="field">
          <label>תלמידה</label>
          <select value={form.studentId} onChange={set('studentId')} required>
            <option value="">בחרי תלמידה מהכיתה</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>סיבת הפנייה</label>
          <input value={form.reason} onChange={set('reason')} required placeholder="לדוגמה: שינוי בהתנהגות" />
        </div>
        <div className="field">
          <label>פירוט</label>
          <textarea value={form.description} onChange={set('description')} rows={3} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" disabled={saving}>{saving ? 'שולחת...' : 'שליחת פנייה'}</button>
          <button type="button" className="btn btn-outline" onClick={onClose}>ביטול</button>
        </div>
      </form>
    </Modal>
  );
}
