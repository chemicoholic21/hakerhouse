'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { developers } from '@/lib/data';

const STORAGE_KEY = 'hackerhouse-fake-auth';

export type FakeSession = {
  username: string;
};

type AuthContextValue = {
  session: FakeSession | null;
  ready: boolean;
  signIn: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function pickFakeUsername(): string {
  const i = Math.floor(Math.random() * developers.length);
  return developers[i]!.username;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<FakeSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (
          parsed &&
          typeof parsed === 'object' &&
          'username' in parsed &&
          typeof (parsed as FakeSession).username === 'string'
        ) {
          setSession({ username: (parsed as FakeSession).username });
        }
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const signIn = useCallback(() => {
    const username = pickFakeUsername();
    const next = { username };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, ready, signIn, signOut }),
    [session, ready, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
