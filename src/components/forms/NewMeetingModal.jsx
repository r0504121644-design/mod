import React, { useState } from 'react';
import Modal from '../Modal.jsx';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { MEETING_TYPE_LABELS } from '../../lib/format.js';

const ALL_TYPES = Object.keys(MEETING_TYPE_LABELS);

export default function NewMeetingModal({ onClose, onCreated, presetStudentId, presetCaseId, students = [] }) {
  const { user } = useAuth();
  const allowedTypes = user.role === 'teacher' ? ['teacher'] : ALL_TYPES;
  const [form, setForm] = useState({
    type: allowedTypes[0],
    studentId: presetStudentId || '',
    meetingDate: new Date().toISOString().slice(0, 16),
    participants: '',
    purpose: '',
    topics: '',
    decisions: '',
    followUp: '',
    confidential: user.role === 'counselor',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const created = await api.post('/meetings', { ...form, caseId: presetCaseId || null });
      onCreated(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="פגישה חדשה" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="login-error">{error}</div>}
        <div className="field">
          <label>סוג פגישה</label>
          <select value={form.type} onChange={set('type')}>
            {allowedTypes.map((t) => (
              <option key={t} value={t}>{MEETING_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        {!presetStudentId && (
          <div className="field">
            <label>תלמידה (אופציונלי)</label>
            <select value={form.studentId} onChange={set('studentId')}>
              <option value="">— ללא תלמידה ספציפית —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="field">
          <label>תאריך ושעה</label>
          <input type="datetime-local" value={form.meetingDate} onChange={set('meetingDate')} required />
        </div>
        <div className="field">
          <label>משתתפים</label>
          <input value={form.participants} onChange={set('participants')} placeholder="לדוגמה: התלמידה, המחנכת" />
        </div>
        <div className="field">
          <label>מטרת הפגישה</label>
          <input value={form.purpose} onChange={set('purpose')} />
        </div>
        <div className="field">
          <label>נושאים שנדונו</label>
          <textarea value={form.topics} onChange={set('topics')} />
        </div>
        <div className="field">
          <label>החלטות</label>
          <textarea value={form.decisions} onChange={set('decisions')} />
        </div>
        <div className="field">
          <label>מעקב נדרש</label>
          <input value={form.followUp} onChange={set('followUp')} />
        </div>
        {user.role === 'counselor' && (
          <div className="field checkbox-row">
            <input type="checkbox" checked={form.confidential} onChange={set('confidential')} id="conf" />
            <label htmlFor="conf" style={{ margin: 0 }}>חסוי ליועצת בלבד</label>
          </div>
        )}
        <div className="modal-actions">
          <button className="btn btn-primary" disabled={saving}>{saving ? 'שומרת...' : 'שמירת פגישה'}</button>
          <button type="button" className="btn btn-outline" onClick={onClose}>ביטול</button>
        </div>
      </form>
    </Modal>
  );
}
