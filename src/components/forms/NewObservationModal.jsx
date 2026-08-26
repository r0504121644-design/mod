import React, { useState } from 'react';
import Modal from '../Modal.jsx';
import { api } from '../../api/client.js';
import { todayISODate } from '../../lib/format.js';

export default function NewObservationModal({ onClose, onCreated, presetStudentId, presetCaseId, students = [] }) {
  const [form, setForm] = useState({
    studentId: presetStudentId || '',
    observationDate: todayISODate(),
    content: '',
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
      const created = await api.post('/observations', { ...form, caseId: presetCaseId || null });
      onCreated(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="תצפית חדשה" onClose={onClose}>
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
          <label>תאריך</label>
          <input type="date" value={form.observationDate} onChange={set('observationDate')} required />
        </div>
        <div className="field">
          <label>תוכן התצפית</label>
          <textarea value={form.content} onChange={set('content')} required rows={4} />
        </div>
        <div className="field checkbox-row">
          <input type="checkbox" checked={form.confidential} onChange={set('confidential')} id="obs-conf" />
          <label htmlFor="obs-conf" style={{ margin: 0 }}>חסוי ליועצת בלבד</label>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" disabled={saving}>{saving ? 'שומרת...' : 'שמירת תצפית'}</button>
          <button type="button" className="btn btn-outline" onClick={onClose}>ביטול</button>
        </div>
      </form>
    </Modal>
  );
}
