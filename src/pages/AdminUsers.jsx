import React, { useState } from 'react';
import Layout from '../components/Layout.jsx';
import Modal from '../components/Modal.jsx';
import { useFetch } from '../lib/hooks.js';
import { api } from '../api/client.js';
import { ROLE_LABELS } from '../context/AuthContext.jsx';
import { formatDate } from '../lib/format.js';

export default function AdminUsers() {
  const { data: users, loading, reload } = useFetch('/admin/users');
  const [showNew, setShowNew] = useState(false);

  return (
    <Layout title="ניהול משתמשות" subtitle="ניהול טכני בלבד — ללא גישה לתוכן ייעוצי">
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <div />
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ משתמשת חדשה</button>
      </div>
      <div className="card">
        {loading && <div className="empty-state">טוענת...</div>}
        {!loading && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>שם</th><th>אימייל</th><th>תפקיד</th><th>סטטוס</th><th>נוצר</th><th></th></tr></thead>
              <tbody>
                {(users || []).map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{ROLE_LABELS[u.role]}</td>
                    <td><span className={`badge ${u.active ? 'badge-success' : 'badge-neutral'}`}>{u.active ? 'פעילה' : 'מושבתת'}</span></td>
                    <td>{formatDate(u.created_at)}</td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={async () => {
                          await api.put(`/admin/users/${u.id}`, { active: !u.active });
                          reload();
                        }}
                      >
                        {u.active ? 'השבתה' : 'הפעלה'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNew && (
        <NewUserModal
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

function NewUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'teacher' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/admin/users', form);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="משתמשת חדשה" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="login-error">{error}</div>}
        <div className="field"><label>שם מלא</label><input value={form.name} onChange={set('name')} required /></div>
        <div className="field"><label>אימייל</label><input type="email" value={form.email} onChange={set('email')} required /></div>
        <div className="field"><label>סיסמה זמנית</label><input type="text" value={form.password} onChange={set('password')} required /></div>
        <div className="field">
          <label>תפקיד</label>
          <select value={form.role} onChange={set('role')}>
            <option value="counselor">יועצת</option>
            <option value="teacher">מחנכת</option>
            <option value="principal">מנהלת</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" disabled={saving}>{saving ? 'יוצרת...' : 'יצירת משתמשת'}</button>
          <button type="button" className="btn btn-outline" onClick={onClose}>ביטול</button>
        </div>
      </form>
    </Modal>
  );
}
