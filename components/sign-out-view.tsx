'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

export function SignOutView() {
  const { signOut, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    signOut();
    router.replace('/');
  }, [ready, signOut, router]);

  return <p className="layout-container py-8 text-sm text-muted-foreground">Signing out…</p>;
}
