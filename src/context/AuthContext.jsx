import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export const ROLE_LABELS = {
  counselor: 'יועצת',
  teacher: 'מחנכת',
  principal: 'מנהלת',
  admin: 'Admin',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/auth/me');
      setUser(data.user);
      setSchool(data.school);
    } catch {
      setUser(null);
      setSchool(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    setUser(data.user);
    setSchool(data.school);
    return data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
    setSchool(null);
  };

  return (
    <AuthContext.Provider value={{ user, school, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
