import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_LABELS } from '../context/AuthContext.jsx';

const NAV_BY_ROLE = {
  counselor: [
    { to: '/', icon: '🏠', label: 'היום שלי' },
    { to: '/students', icon: '👩‍🎓', label: 'תלמידות' },
    { to: '/referrals', icon: '📨', label: 'פניות מחנכות' },
    { to: '/meetings', icon: '🗓️', label: 'פגישות' },
    { to: '/tasks', icon: '✅', label: 'משימות' },
  ],
  teacher: [
    { to: '/', icon: '🏠', label: 'היום שלי' },
    { to: '/students', icon: '👩‍🎓', label: 'תלמידות הכיתה' },
    { to: '/referrals', icon: '📨', label: 'הפניות שלי' },
    { to: '/tasks', icon: '✅', label: 'משימות' },
  ],
  principal: [
    { to: '/', icon: '🏠', label: 'תמונת מצב' },
    { to: '/students', icon: '👩‍🎓', label: 'תלמידות' },
    { to: '/meetings', icon: '🗓️', label: 'פגישות' },
    { to: '/tasks', icon: '✅', label: 'משימות' },
  ],
  admin: [
    { to: '/', icon: '🏠', label: 'סקירה טכנית' },
    { to: '/admin/users', icon: '👤', label: 'משתמשות' },
    { to: '/admin/audit', icon: '🗒️', label: 'יומן פעילות' },
  ],
};

export default function Layout({ children, title, subtitle }) {
  const { user, school, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const navItems = NAV_BY_ROLE[user.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('');

  return (
    <div>
      {school?.is_demo ? (
        <div className="demo-banner">DEMO — אין להזין מידע אמיתי · {school.name}</div>
      ) : null}
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="logo">יועצת+</div>
            <div className="tagline">סביבת העבודה החכמה ליועצת החינוכית</div>
          </div>
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
              >
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-foot">
            <div className="sidebar-user">
              <div className="avatar">{initials}</div>
              <div>
                <div className="name">{user.name}</div>
                <div className="role">{ROLE_LABELS[user.role]}</div>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>התנתקות</button>
          </div>
        </aside>
        <div className="main-area">
          <header className="topbar">
            <div>
              <h1>{title}</h1>
              {subtitle && <div className="subtitle">{subtitle}</div>}
            </div>
          </header>
          <main className="page-content">{children}</main>
        </div>
      </div>
    </div>
  );
}
