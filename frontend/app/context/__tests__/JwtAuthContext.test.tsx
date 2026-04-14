/**
 * TDD: login sets auth_token cookie on the frontend domain so that
 * Next.js middleware can read it and allow navigation to protected routes.
 *
 * Bug: After successful login, the app stays on the login screen because
 * middleware reads request.cookies.get('auth_token') — this cookie must
 * exist on the frontend domain (localhost:3000), not the backend domain
 * (localhost:4000) where the backend's Set-Cookie header sets it.
 */

import { renderHook, act } from '@testing-library/react';
import { JwtAuthProvider, useJwtAuth } from '../JwtAuthContext';
import React from 'react';

// Mock api-client so no real HTTP calls are made
jest.mock('@/app/lib/api-client', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

import apiClient from '@/app/lib/api-client';
const mockPost = apiClient.post as jest.Mock;
const mockGet = apiClient.get as jest.Mock;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <JwtAuthProvider>{children}</JwtAuthProvider>
);

function getCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];
}

function clearCookie(name: string) {
  document.cookie = `${name}=; max-age=0; path=/`;
}

beforeEach(() => {
  localStorage.clear();
  clearCookie('auth_token');
  mockPost.mockReset();
  mockGet.mockReset();
  // hydrateFromCookie: no stored token → unauthenticated (no /auth/me call)
});

describe('JwtAuthContext — login', () => {
  it('sets auth_token cookie on the frontend domain after login', async () => {
    const TOKEN = 'test-jwt-token-abc123';
    mockPost.mockResolvedValueOnce({
      data: { accessToken: TOKEN, user: { id: '1', email: 'a@b.com', name: 'A', image: null } },
    });

    const { result } = renderHook(() => useJwtAuth(), { wrapper });

    await act(async () => {
      await result.current.login('a@b.com', 'password');
    });

    // The cookie must be present on the frontend domain so middleware can read it
    expect(getCookie('auth_token')).toBe(TOKEN);
  });

  it('sets auth_token cookie on the frontend domain after register', async () => {
    const TOKEN = 'register-jwt-token-xyz';
    mockPost.mockResolvedValueOnce({
      data: { accessToken: TOKEN, user: { id: '2', email: 'b@c.com', name: 'B', image: null } },
    });

    const { result } = renderHook(() => useJwtAuth(), { wrapper });

    await act(async () => {
      await result.current.register('B', 'b@c.com', 'password');
    });

    expect(getCookie('auth_token')).toBe(TOKEN);
  });

  it('clears auth_token cookie on logout', async () => {
    document.cookie = 'auth_token=some-token; path=/';
    localStorage.setItem('auth_token', 'some-token');
    mockGet.mockResolvedValueOnce({
      data: { id: '1', email: 'a@b.com', name: 'A', image: null },
    });
    mockPost.mockResolvedValueOnce({});

    const { result } = renderHook(() => useJwtAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(getCookie('auth_token')).toBeUndefined();
  });
});
