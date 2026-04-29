'use client';

import { JwtAuthProvider } from './JwtAuthContext';

interface AuthContextProps {
  children: React.ReactNode;
}

export default function AuthContext({ children }: AuthContextProps) {
  return <JwtAuthProvider>{children}</JwtAuthProvider>;
}
