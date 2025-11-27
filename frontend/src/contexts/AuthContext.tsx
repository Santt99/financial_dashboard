import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface AuthContextValue {
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  });

  // Persist token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }, [token]);

  const baseURL = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:8000';

  async function register(email: string, password: string) {
    const res = await axios.post(baseURL + '/auth/register', { email, password });
    setToken(res.data.access_token);
    return true;
  }
  async function login(email: string, password: string) {
    const res = await axios.post(baseURL + '/auth/login', { email, password });
    setToken(res.data.access_token);
    return true;
  }
  function logout() { setToken(null); }

  return <AuthContext.Provider value={{ token, register, login, logout }}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
