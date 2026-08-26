import React, { useState } from 'react';
import Modal from '../Modal.jsx';
import { api } from '../../api/client.js';
import { useUserDirectory } from '../../lib/hooks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { todayISODate } from '../../lib/format.js';

export default function NewTaskModal({ onClose, onCreated, presetStudentId, presetCaseId, students = [] }) {
  const { user } = useAuth();
  const { data: directory } = useUserDirectory();
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeId: user.id,
    dueDate: todayISODate(),
    priority: 'medium',
    studentId: presetStudentId || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const created = await api.post('/tasks', { ...form, caseId: presetCaseId || null });
      onCreated(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="משימה חדשה" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="login-error">{error}</div>}
        <div className="field">
          <label>כותרת</label>
          <input value={form.title} onChange={set('title')} required />
        </div>
        <div className="field">
          <label>תיאור</label>
          <textarea value={form.description} onChange={set('description')} />
        </div>
        <div className="grid grid-2">
          <div className="field">
            <label>אחראית</label>
            <select value={form.assigneeId} onChange={set('assigneeId')}>
              {(directory || [{ id: user.id, name: user.name }]).map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>תאריך יעד</label>
            <input type="date" value={form.dueDate} onChange={set('dueDate')} />
          </div>
        </div>
        <div className="field">
          <label>עדיפות</label>
          <select value={form.priority} onChange={set('priority')}>
            <option value="low">נמוכה</option>
            <option value="medium">רגילה</option>
            <option value="high">גבוהה</option>
          </select>
        </div>
        {!presetStudentId && (
          <div className="field">
            <label>קישור לתלמידה (אופציונלי)</label>
            <select value={form.studentId} onChange={set('studentId')}>
              <option value="">— ללא —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="modal-actions">
          <button className="btn btn-primary" disabled={saving}>{saving ? 'שומרת...' : 'שמירת משימה'}</button>
          <button type="button" className="btn btn-outline" onClick={onClose}>ביטול</button>
        </div>
      </form>
    </Modal>
  );
}
