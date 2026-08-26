import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Demo1234!');
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="logo">יועצת+</div>
          <div className="tagline">סביבת העבודה החכמה ליועצת החינוכית</div>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label>אימייל</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@school.school" required />
          </div>
          <div className="field">
            <label>סיסמה</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }} disabled={loading}>
            {loading ? 'מתחברת...' : 'התחברות'}
          </button>
        </form>

        <div className="demo-hint">
          <strong>גישה להדגמה — בית ספר דמו</strong><br />
          סיסמה לכל המשתמשות: <code>Demo1234!</code>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => fillDemo('counselor@demo.school')}>יועצת</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => fillDemo('teacher@demo.school')}>מחנכת</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => fillDemo('principal@demo.school')}>מנהלת</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => fillDemo('admin@demo.school')}>Admin</button>
          </div>
        </div>

        <div className="login-footer">
          קונספט ופיתוח מוצר: מרים רצקר — מפתחת אפליקציות פסיכו־חינוכיות
        </div>
      </div>
    </div>
  );
}
