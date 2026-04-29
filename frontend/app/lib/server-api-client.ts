import { cookies } from 'next/headers';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('auth_token')?.value ?? null;
  } catch {
    return null;
  }
}

async function serverFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T | null> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (res.status === 401 || res.status === 403) {
    return null;
  }

  if (!res.ok) {
    throw new ApiError(res.status, `API request to ${path} failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function serverGet<T = unknown>(path: string): Promise<T | null> {
  return serverFetch<T>(path);
}

export async function serverPost<T = unknown>(path: string, body: unknown): Promise<T | null> {
  return serverFetch<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
