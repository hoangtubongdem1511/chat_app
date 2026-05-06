'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '@/app/lib/api-client';
import { connectSocket, disconnectSocket } from '@/app/libs/socket';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

interface JwtAuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginOAuth: (provider: 'google' | 'github') => void;
  logout: () => Promise<void>;
  hydrateFromCookie: () => Promise<void>;
}

const JwtAuthContext = createContext<JwtAuthContextValue | null>(null);

export function JwtAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    status: 'loading',
  });

  /**
   * Fetch the current user from /auth/me.
   * The HttpOnly cookie is attached automatically by the browser.
   * We also keep the token in localStorage for the Axios interceptor.
   */
  const hydrateFromCookie = useCallback(async () => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!stored) {
      setState({ user: null, token: null, status: 'unauthenticated' });
      return;
    }
    try {
      const res = await apiClient.get<AuthUser>('/auth/me');
      setState({ user: res.data, token: stored, status: 'authenticated' });
      connectSocket();
    } catch {
      localStorage.removeItem('auth_token');
      setState({ user: null, token: null, status: 'unauthenticated' });
    }
  }, []);

  useEffect(() => {
    hydrateFromCookie();
  }, [hydrateFromCookie]);

  /**
   * Persist the token both in localStorage (for the Axios interceptor) and
   * as a JS-accessible cookie on the frontend domain (for Next.js middleware).
   * The backend's own Set-Cookie header targets localhost:4000, which is a
   * different origin, so the middleware at localhost:3000 cannot see it.
   */
  const persistToken = (token: string) => {
    localStorage.setItem('auth_token', token);
    const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
    document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; samesite=lax`;
  };

  const login = async (email: string, password: string) => {
    const res = await apiClient.post<{ accessToken: string; user: AuthUser }>('/auth/login', {
      email,
      password,
    });
    persistToken(res.data.accessToken);
    setState({ user: res.data.user, token: res.data.accessToken, status: 'authenticated' });
    connectSocket();
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await apiClient.post<{ accessToken: string; user: AuthUser }>('/auth/register', {
      name,
      email,
      password,
    });
    persistToken(res.data.accessToken);
    setState({ user: res.data.user, token: res.data.accessToken, status: 'authenticated' });
    connectSocket();
  };

  const loginOAuth = (provider: 'google' | 'github') => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    window.location.href = `${apiUrl}/auth/${provider}`;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // best-effort
    }
    disconnectSocket();
    localStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; path=/; max-age=0; samesite=lax';
    setState({ user: null, token: null, status: 'unauthenticated' });
  };

  return (
    <JwtAuthContext.Provider
      value={{ ...state, login, register, loginOAuth, logout, hydrateFromCookie }}
    >
      {children}
    </JwtAuthContext.Provider>
  );
}

export function useJwtAuth() {
  const ctx = useContext(JwtAuthContext);
  if (!ctx) throw new Error('useJwtAuth must be used inside JwtAuthProvider');
  return ctx;
}

export default JwtAuthContext;
