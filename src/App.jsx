import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import StudentFile from './pages/StudentFile.jsx';
import Meetings from './pages/Meetings.jsx';
import Tasks from './pages/Tasks.jsx';
import Referrals from './pages/Referrals.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminAudit from './pages/AdminAudit.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="empty-state">טוענת...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/students" element={<Protected><Students /></Protected>} />
        <Route path="/students/:id" element={<Protected><StudentFile /></Protected>} />
        <Route path="/meetings" element={<Protected><RequireRole roles={['counselor','teacher','principal']}><Meetings /></RequireRole></Protected>} />
        <Route path="/tasks" element={<Protected><RequireRole roles={['counselor','teacher','principal']}><Tasks /></RequireRole></Protected>} />
        <Route path="/referrals" element={<Protected><RequireRole roles={['counselor','teacher']}><Referrals /></RequireRole></Protected>} />
        <Route path="/admin/users" element={<Protected><RequireRole roles={['admin']}><AdminUsers /></RequireRole></Protected>} />
        <Route path="/admin/audit" element={<Protected><RequireRole roles={['admin']}><AdminAudit /></RequireRole></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
