'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

export function SignInView() {
  const { signIn, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    signIn();
    router.replace('/');
  }, [ready, signIn, router]);

  return <p className="layout-container py-8 text-sm text-muted-foreground">Signing in…</p>;
}
