'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { useAuth } from './auth-provider';
import { useMessageDock } from './message-dock-provider';

export function ProfileMessageSidebar({ targetUsername }: { targetUsername: string }) {
  const { session, ready } = useAuth();
  const { openMessageDock } = useMessageDock();

  const canDm = ready && session && session.username !== targetUsername;

  if (!canDm || !session) return null;

  return (
    <section className="border-2 border-dashed border-foreground/70 p-5">
      <h2 className="text-sm font-bold mb-2">Message</h2>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        Send a direct message as{' '}
        <span className="font-mono text-foreground">{session.username}</span>.
      </p>
      <Link
        href={`/${targetUsername}`}
        onClick={(e) => {
          e.preventDefault();
          openMessageDock(targetUsername);
        }}
        className="w-full border-2 border-foreground px-4 py-2 text-sm font-medium hover:bg-foreground hover:text-background inline-flex items-center justify-center gap-2 cursor-pointer"
      >
        <MessageCircle className="w-4 h-4" aria-hidden strokeWidth={2.5} />
        Message
      </Link>
    </section>
  );
}
