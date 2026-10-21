import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('uc_token');
    const role  = localStorage.getItem('uc_role');
    const ward  = localStorage.getItem('uc_ward');
    const name  = localStorage.getItem('uc_name');
    return token ? { token, role, ward, name } : null;
  });

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('uc_token');
    if (!token) return;
    try {
      const res = await api.get('/api/v1/users/me');
      if (res.data?.data) {
        const u = res.data.data;
        setUser((prev) => ({
          ...prev,
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          ward: u.ward,
          phone: u.phone,
          department: u.department,
          notificationPreferences: u.notificationPreferences,
          picture: u.picture,
        }));
        if (u.name) localStorage.setItem('uc_name', u.name);
        if (u.role) localStorage.setItem('uc_role', u.role);
        if (u.ward) localStorage.setItem('uc_ward', u.ward);
      }
    } catch {
      // Token might be expired or server not ready yet
    }
  }, []);

  useEffect(() => {
    if (user?.token) {
      fetchProfile();
    }
  }, [user?.token, fetchProfile]);

  const login = useCallback((token, role, ward, name) => {
    localStorage.setItem('uc_token', token);
    localStorage.setItem('uc_role', role);
    if (ward) localStorage.setItem('uc_ward', ward);
    if (name) localStorage.setItem('uc_name', name);
    setUser({ token, role, ward, name });
    // Fetch full profile immediately
    api.get('/api/v1/users/me')
      .then((res) => {
        if (res.data?.data) {
          const u = res.data.data;
          setUser({
            token,
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            ward: u.ward,
            phone: u.phone,
            department: u.department,
            notificationPreferences: u.notificationPreferences,
            picture: u.picture,
          });
        }
      })
      .catch(() => {});
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields };
      if (updatedFields.role) localStorage.setItem('uc_role', updatedFields.role);
      if (updatedFields.ward !== undefined) localStorage.setItem('uc_ward', updatedFields.ward);
      if (updatedFields.name) localStorage.setItem('uc_name', updatedFields.name);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('uc_token');
    localStorage.removeItem('uc_role');
    localStorage.removeItem('uc_ward');
    localStorage.removeItem('uc_name');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
