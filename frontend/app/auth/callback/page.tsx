'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useJwtAuth } from '@/app/context/JwtAuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { hydrateFromCookie } = useJwtAuth();

  useEffect(() => {
    // The NestJS backend sets an HttpOnly cookie during OAuth.
    // Fetch /auth/me to load the user into client state, then redirect.
    hydrateFromCookie().then(() => {
      router.push('/users');
    });
  }, [hydrateFromCookie, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500 mx-auto mb-4" />
        <p className="text-gray-500">Signing you in...</p>
      </div>
    </div>
  );
}
