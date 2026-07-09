import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BRAND, ROLES } from '../lib/constants';
import { weakHash } from '../lib/auth';
import { list } from '../lib/store';
import { Field, GoldDivider } from '../components/UI';
import logo from '../assets/logo.jpg';

export default function AuthScreen() {
  const { entities, upsert, setSession, notify } = useApp();
  const [mode, setMode] = useState('signup'); // signup | signin
  const [hasCode, setHasCode] = useState(false);
  const [form, setForm] = useState({ displayName: '', email: '', password: '', inviteCode: '' });
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function findUserByEmail(email) {
    return list(entities, 'users').find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  function handleSignIn(e) {
    e.preventDefault();
    setError('');
    const user = findUserByEmail(form.email);
    if (!user || user.passwordHash !== weakHash(form.password)) {
      setError('אימייל או סיסמה שגויים.');
      return;
    }
    const membership = list(entities, 'memberships').find((m) => m.userId === user.id && m.status === 'פעיל');
    setSession({
      currentUserId: user.id,
      currentFamilyId: membership?.familyId || null,
      currentParentId: null,
    });
    notify(`ברוך שובך, ${user.displayName}`);
  }

  function handleSignUp(e) {
    e.preventDefault();
    setError('');
    if (!form.displayName.trim() || !form.email.trim() || form.password.length < 4) {
      setError('נא למלא שם, אימייל וסיסמה בת 4 תווים לפחות.');
      return;
    }
    if (findUserByEmail(form.email)) {
      setError('כבר קיים משתמש עם אימייל זה. נסו להתחבר.');
      return;
    }
    const user = upsert('users', {
      displayName: form.displayName.trim(),
      email: form.email.trim(),
      passwordHash: weakHash(form.password),
      language: 'he',
      notifyPrefs: { inApp: true, push: true },
    }, { audit: false });

    if (hasCode && form.inviteCode.trim()) {
      const pending = list(entities, 'memberships').find(
        (m) => m.inviteCode === form.inviteCode.trim().toUpperCase() && m.status === 'ממתין'
      );
      if (!pending) {
        setError('קוד ההזמנה לא נמצא או שכבר נוצל. אפשר לבקש קוד חדש מהמנהל המשפחתי.');
        return;
      }
      upsert('memberships', { ...pending, userId: user.id, status: 'פעיל', joinedAt: new Date().toISOString() }, { actor: user });
      setSession({ currentUserId: user.id, currentFamilyId: pending.familyId, currentParentId: null });
      notify('הצטרפת למרחב המשפחתי בהצלחה!');
      return;
    }

    setSession({ currentUserId: user.id, currentFamilyId: null, currentParentId: null });
  }

  return (
    <div className="auth-hero">
      <div className="auth-card">
        <div className="center" style={{ marginBottom: 18 }}>
          <img src={logo} alt={`${BRAND.company} — ${BRAND.app}`} className="logo-badge" style={{ width: 108, height: 108, margin: '0 auto 10px' }} />
          <h1 style={{ marginBottom: 2 }}>{BRAND.app}</h1>
          <p className="auth-tagline">{BRAND.tagline}</p>
          <GoldDivider><span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>{BRAND.company}</span></GoldDivider>
        </div>

        <div className="row" style={{ justifyContent: 'center', marginBottom: 18 }}>
          <button className={`btn btn-sm ${mode === 'signup' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('signup')}>הרשמה</button>
          <button className={`btn btn-sm ${mode === 'signin' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('signin')}>התחברות</button>
        </div>

        {mode === 'signup' ? (
          <form onSubmit={handleSignUp} className="stack">
            <Field label="שם תצוגה"><input value={form.displayName} onChange={set('displayName')} placeholder="לדוגמה: דנה" /></Field>
            <Field label="אימייל"><input type="email" value={form.email} onChange={set('email')} /></Field>
            <Field label="סיסמה" hint="לצורכי הדגמה בלבד — ראו הערת פרטיות באודות."><input type="password" value={form.password} onChange={set('password')} /></Field>
            <label className="row small" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={hasCode} onChange={(e) => setHasCode(e.target.checked)} />
              יש לי קוד הזמנה למרחב משפחתי קיים
            </label>
            {hasCode && (
              <Field label="קוד הזמנה"><input value={form.inviteCode} onChange={set('inviteCode')} placeholder="לדוגמה: AB12CD" /></Field>
            )}
            {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
            <button className="btn btn-primary" type="submit">{hasCode ? 'הצטרפות למשפחה' : 'יצירת מרחב משפחתי חדש'}</button>
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="stack">
            <Field label="אימייל"><input type="email" value={form.email} onChange={set('email')} /></Field>
            <Field label="סיסמה"><input type="password" value={form.password} onChange={set('password')} /></Field>
            {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
            <button className="btn btn-primary" type="submit">התחברות</button>
          </form>
        )}
        <p className="small muted center" style={{ marginTop: 16 }}>{Object.values(ROLES).join(' · ')}</p>
      </div>
    </div>
  );
}
