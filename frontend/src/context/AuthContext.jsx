import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'tms_token';

function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isTokenExpired(payload) {
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

function loginPathForRole(role) {
  const map = { customer: '/customer/login', staff: '/staff/login', driver: '/driver/login', owner: '/owner/login' };
  return map[role] ?? '/customer/login';
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ token: null, user: null });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const payload = decodeJwt(stored);
      if (payload && !isTokenExpired(payload)) {
        setAuth({ token: stored, user: { userId: payload.userId, role: payload.role } });
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const login = useCallback((token) => {
    const payload = decodeJwt(token);
    if (!payload) return;
    localStorage.setItem(STORAGE_KEY, token);
    setAuth({ token, user: { userId: payload.userId, role: payload.role } });
  }, []);

  const logout = useCallback(() => {
    const role = auth.user?.role;
    localStorage.removeItem(STORAGE_KEY);
    setAuth({ token: null, user: null });
    window.location.href = loginPathForRole(role);
  }, [auth.user?.role]);

  return (
    <AuthContext.Provider value={{ token: auth.token, user: auth.user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
