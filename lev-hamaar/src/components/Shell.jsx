import React from 'react';
import { useApp } from '../context/AppContext';
import { BRAND } from '../lib/constants';
import { byFamily } from '../lib/store';
import logo from '../assets/logo.jpg';

export const CORE_SCREENS = [
  { key: 'home', label: 'בית', icon: '🏠' },
  { key: 'medications', label: 'תרופות ומלאי', icon: '💊' },
  { key: 'appointments', label: 'תורים', icon: '🩺' },
  { key: 'tasks', label: 'משימות', icon: '✅' },
  { key: 'visitReport', label: 'דיווח ביקור', icon: '📝' },
  { key: 'agent', label: 'שיחה עם לב המעבר', icon: '💬' },
  { key: 'alerts', label: 'התראות', icon: '🔔' },
  { key: 'family', label: 'בני משפחה והרשאות', icon: '👪' },
  { key: 'settings', label: 'הגדרות ואודות', icon: 'ℹ️' },
];

export const ADVANCED_SCREENS = [
  { key: 'measurements', label: 'מדדים', icon: '📈' },
  { key: 'shifts', label: 'תורנויות', icon: '📅' },
  { key: 'documents', label: 'מסמכים', icon: '📁' },
  { key: 'reports', label: 'דוחות', icon: '📊' },
  { key: 'automations', label: 'לוח אוטומציות', icon: '🤖' },
];

export const ADMIN_SCREENS = [
  { key: 'auditLog', label: 'יומן פעילות', icon: '🧾' },
  { key: 'adminMetrics', label: 'לוח מדדי פיילוט', icon: '📐' },
];

export function Shell({ active, onNavigate, children }) {
  const { currentFamily, currentUser, roleKeys, session, setSession, city, shabbatActive, shabbatWindow, notify } = useApp();
  const isAdmin = roleKeys.includes('FAMILY_ADMIN');
  const advancedMode = !!session.advancedMode;

  const NavGroup = ({ title, items }) => (
    <>
      <div className="nav-group-title">{title}</div>
      {items.map((s) => (
        <button
          key={s.key}
          className={`nav-item ${active === s.key ? 'active' : ''}`}
          onClick={() => onNavigate(s.key)}
        >
          <span className="icon" aria-hidden="true">{s.icon}</span>
          <span>{s.label}</span>
        </button>
      ))}
    </>
  );

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">דלג לתוכן</a>
      <nav className="sidebar" aria-label="ניווט ראשי">
        <div className="sidebar-brand row" style={{ flexWrap: 'nowrap' }}>
          <img src={logo} alt={BRAND.company} className="logo-badge" style={{ width: 42, height: 42 }} />
          <div>
            <div className="app-name">לב המעבר™</div>
            <div className="company-name">מבית {BRAND.company}</div>
          </div>
        </div>
        <NavGroup title="ליבה" items={CORE_SCREENS} />
        {advancedMode && <NavGroup title="מתקדם" items={ADVANCED_SCREENS} />}
        {!advancedMode && (
          <button className="nav-item" onClick={() => setSession({ advancedMode: true })}>
            <span className="icon">➕</span>
            <span>עוד יכולות (מדדים, תורנויות...)</span>
          </button>
        )}
        {isAdmin && <NavGroup title="ניהול פיילוט" items={ADMIN_SCREENS} />}
      </nav>
      <div className="main-area">
        <header className="topbar">
          <div className="row">
            {currentFamily && <strong>{currentFamily.name}</strong>}
            <ParentSwitcher />
          </div>
          <div className="row">
            <span className="badge" title={`מיקום: ${city.name}`}>
              {shabbatActive ? `🕯️ מצב שבת פעיל — עד ${shabbatWindow.havdalahLabel}` : `כניסת שבת: ${shabbatWindow.candleLabel}`}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSession({ fontScale: session.fontScale >= 1.3 ? 1 : (session.fontScale || 1) + 0.15 })}
              aria-label="הגדלת גופן"
            >א+</button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSession({ contrast: session.contrast === 'high' ? 'normal' : 'high' })}
            >ניגודיות</button>
            {currentUser && <span className="badge badge-muted">{currentUser.displayName}</span>}
            <button className="btn btn-secondary btn-sm" onClick={() => { setSession({ currentUserId: null }); notify('התנתקת בהצלחה'); }}>
              יציאה
            </button>
          </div>
        </header>
        <main className="content" id="main-content">{children}</main>
        <div className="credit-line">{BRAND.credit}</div>
      </div>
    </div>
  );
}

function ParentSwitcher() {
  const { entities, currentFamily, session, setSession } = useApp();
  if (!currentFamily) return null;
  const parents = byFamily(entities, 'parents', currentFamily.id);
  if (parents.length <= 1) return null;
  return (
    <div className="parent-switcher" role="tablist" aria-label="בחירת הורה">
      {parents.map((p) => (
        <button
          key={p.id}
          role="tab"
          aria-selected={session.currentParentId === p.id}
          className={session.currentParentId === p.id ? 'active' : ''}
          onClick={() => setSession({ currentParentId: p.id })}
        >
          {p.nickname}
        </button>
      ))}
    </div>
  );
}
