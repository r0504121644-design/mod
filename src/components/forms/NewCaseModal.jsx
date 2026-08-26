import React, { useState } from 'react';
import Modal from '../Modal.jsx';
import { api } from '../../api/client.js';

export default function NewCaseModal({ onClose, onCreated, presetStudentId, students = [], referralId }) {
  const [form, setForm] = useState({
    studentId: presetStudentId || '',
    title: '',
    summary: '',
    confidential: true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const created = await api.post('/cases', { ...form, referralId: referralId || null });
      onCreated(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="פתיחת תיק ייעוצי" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="login-error">{error}</div>}
        {!presetStudentId && (
          <div className="field">
            <label>תלמידה</label>
            <select value={form.studentId} onChange={set('studentId')} required>
              <option value="">בחרי תלמידה</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="field">
          <label>כותרת התיק</label>
          <input value={form.title} onChange={set('title')} required placeholder="לדוגמה: קושי חברתי בכיתה" />
        </div>
        <div className="field">
          <label>תקציר</label>
          <textarea value={form.summary} onChange={set('summary')} rows={3} />
        </div>
        <div className="field checkbox-row">
          <input type="checkbox" checked={form.confidential} onChange={set('confidential')} id="case-conf" />
          <label htmlFor="case-conf" style={{ margin: 0 }}>חסוי ליועצת בלבד</label>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" disabled={saving}>{saving ? 'פותחת תיק...' : 'פתיחת תיק'}</button>
          <button type="button" className="btn btn-outline" onClick={onClose}>ביטול</button>
        </div>
      </form>
    </Modal>
  );
}
