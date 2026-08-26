import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../api/client.js';

export default function Students() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState('active');
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState(null);

  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (classId) query.set('classId', classId);
  if (status) query.set('status', status);

  const { data: students, loading, reload } = useFetch(`/students?${query.toString()}`, [search, classId, status]);
  const { data: classes } = useFetch('/classes');

  const isCounselor = user.role === 'counselor';

  return (
    <Layout title={user.role === 'teacher' ? 'תלמידות הכיתה' : 'תלמידות'} subtitle={`${students?.length ?? ''} תלמידות`}>
      <div className="search-bar">
        <input placeholder="חיפוש לפי שם..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">כל הכיתות</option>
          {(classes || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {isCounselor && (
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">פעילות</option>
            <option value="archived">בארכיון</option>
          </select>
        )}
        {isCounselor && (
          <button className="btn btn-primary" style={{ marginRight: 'auto' }} onClick={() => setShowNew(true)}>+ הוספת תלמידה</button>
        )}
      </div>

      <div className="card">
        {loading && <div className="empty-state">טוענת...</div>}
        {!loading && (students || []).length === 0 && <div className="empty-state">לא נמצאו תלמידות</div>}
        {!loading && students && students.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>שם</th>
                  <th>כיתה</th>
                  <th>סטטוס</th>
                  {isCounselor && <th></th>}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="clickable" onClick={() => navigate(`/students/${s.id}`)}>
                    <td>{s.first_name} {s.last_name}</td>
                    <td>{s.class_name || '—'}</td>
                    <td>
                      <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                        {s.status === 'active' ? 'פעילה' : 'בארכיון'}
                      </span>
                    </td>
                    {isCounselor && (
                      <td onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditing(s)}>עריכה</button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={async () => {
                            await api.post(`/students/${s.id}/archive`);
                            reload();
                          }}
                        >
                          {s.status === 'active' ? 'העבר לארכיון' : 'שחזור'}
                        </button>
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
        <NewStudentModal
          classes={classes || []}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            reload();
          }}
        />
      )}
      {editing && (
        <EditStudentModal
          student={editing}
          classes={classes || []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </Layout>
  );
}

function EditStudentModal({ student, classes, onClose, onSaved }) {
  const [form, setForm] = useState({
    firstName: student.first_name,
    lastName: student.last_name,
    classId: student.class_id || '',
    strengthsResources: student.strengths_resources || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put(`/students/${student.id}`, form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="עריכת תלמידה" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="login-error">{error}</div>}
        <div className="grid grid-2">
          <div className="field">
            <label>שם פרטי</label>
            <input value={form.firstName} onChange={set('firstName')} required />
          </div>
          <div className="field">
            <label>שם משפחה</label>
            <input value={form.lastName} onChange={set('lastName')} required />
          </div>
        </div>
        <div className="field">
          <label>כיתה</label>
          <select value={form.classId} onChange={set('classId')}>
            <option value="">— ללא כיתה —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>חוזקות ומשאבים</label>
          <textarea value={form.strengthsResources} onChange={set('strengthsResources')} rows={2} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" disabled={saving}>{saving ? 'שומרת...' : 'שמירה'}</button>
          <button type="button" className="btn btn-outline" onClick={onClose}>ביטול</button>
        </div>
      </form>
    </Modal>
  );
}

function NewStudentModal({ onClose, onCreated, classes }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', classId: '', gender: '', strengthsResources: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/students', form);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="הוספת תלמידה" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="login-error">{error}</div>}
        <div className="grid grid-2">
          <div className="field">
            <label>שם פרטי</label>
            <input value={form.firstName} onChange={set('firstName')} required />
          </div>
          <div className="field">
            <label>שם משפחה</label>
            <input value={form.lastName} onChange={set('lastName')} required />
          </div>
        </div>
        <div className="field">
          <label>כיתה</label>
          <select value={form.classId} onChange={set('classId')}>
            <option value="">— ללא כיתה —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>חוזקות ומשאבים</label>
          <textarea value={form.strengthsResources} onChange={set('strengthsResources')} rows={2} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" disabled={saving}>{saving ? 'שומרת...' : 'הוספה'}</button>
          <button type="button" className="btn btn-outline" onClick={onClose}>ביטול</button>
        </div>
      </form>
    </Modal>
  );
}
