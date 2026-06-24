'use client';

import { signIn } from 'next-auth/react';
import { Github } from 'lucide-react';

export function GithubSignInButton() {
  return (
    <button
      onClick={() => signIn('github', { callbackUrl: '/' })}
      className="w-full flex items-center justify-center gap-3 border-2 border-foreground py-3 font-bold hover:bg-foreground hover:text-background transition-colors"
    >
      <Github className="w-5 h-5" />
      <span>Continue with GitHub</span>
    </button>
  );
}
