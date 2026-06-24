'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronUp, Minus, Send, X } from 'lucide-react';
import { inboxThreadPreviews } from '@/lib/inbox-threads';

export type ChatBubble = {
  id: string;
  from: 'self' | 'peer';
  text: string;
  time: string;
};

export function MessageChatDock({
  open,
  onClose,
  peerUsername,
  onOpenPeer,
  onBackToInbox,
  selfUsername,
}: {
  open: boolean;
  onClose: () => void;
  peerUsername: string | null;
  onOpenPeer: (peer: string) => void;
  onBackToInbox: () => void;
  selfUsername: string;
}) {
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [draft, setDraft] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isInbox = peerUsername === null;

  useEffect(() => {
    if (!open) {
      setCollapsed(false);
      return;
    }
    if (peerUsername) {
      setMessages([]);
      setDraft('');
    }
    setCollapsed(false);
  }, [open, peerUsername]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (peerUsername) onBackToInbox();
      else onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, peerUsername, onBackToInbox, onClose]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, isInbox]);

  if (!open) return null;

  /** Below md: centered 90×90 modal; md+: bottom-right sheet (matches hooks/use-mobile 768px). */
  const dockCollapsed =
    'fixed z-[100] bottom-0 border-2 border-foreground bg-background/90 backdrop-blur-sm flex items-center justify-between gap-2 px-3 py-2 max-md:left-1/2 max-md:right-auto max-md:w-[min(90vw,360px)] max-md:-translate-x-1/2 md:left-auto md:right-5 md:w-[360px]';
  const dockExpanded =
    'fixed z-[100] border-2 border-foreground bg-background/90 backdrop-blur-sm flex flex-col max-md:left-1/2 max-md:top-1/2 max-md:-translate-x-1/2 max-md:-translate-y-1/2 max-md:bottom-auto max-md:right-auto max-md:w-[90vw] max-md:h-[90dvh] max-md:max-h-[90dvh] md:bottom-0 md:left-auto md:right-5 md:top-auto md:translate-x-0 md:translate-y-0 md:w-[360px] md:h-[min(100dvh,420px)] md:max-h-[min(100dvh,420px)]';

  const mobileBackdrop = (
    <div
      className="fixed inset-0 z-[99] bg-foreground/25 md:hidden"
      aria-hidden
      onClick={onClose}
    />
  );

  const headerTitle = isInbox ? 'Inbox' : peerUsername;
  const collapsedLabel = isInbox ? 'Inbox' : peerUsername;

  if (collapsed) {
    return (
      <>
        {mobileBackdrop}
        <div
          className={dockCollapsed}
          role="dialog"
          aria-label={isInbox ? 'Inbox' : `Message ${peerUsername}`}
          onDoubleClick={() => setCollapsed(false)}
        >
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="min-w-0 flex-1 text-left text-sm font-bold text-highlight truncate hover:underline underline-offset-2"
            aria-expanded="false"
          >
            {collapsedLabel}
          </button>
          <div
            className="flex items-center gap-0.5 shrink-0"
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="p-1 hover:bg-foreground/10"
              aria-label="Expand"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-foreground/10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </>
    );
  }

  function send() {
    const t = draft.trim();
    if (!t || !peerUsername) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((m) => [...m, { id: `m-${now.getTime()}`, from: 'self', text: t, time }]);
    setDraft('');
  }

  return (
    <>
      {mobileBackdrop}
      <div
        className={dockExpanded}
        role="dialog"
        aria-label={isInbox ? 'Inbox' : `Message ${peerUsername}`}
        aria-expanded="true"
      >
        <div
          className="flex items-center justify-between gap-2 px-3 py-2 border-b-2 border-foreground shrink-0 cursor-default"
          onDoubleClick={() => setCollapsed(true)}
        >
          {isInbox ? (
            <p className="text-sm font-bold text-highlight truncate min-w-0">Inbox</p>
          ) : (
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <button
                type="button"
                onClick={onBackToInbox}
                className="p-1 shrink-0 hover:bg-foreground/10"
                aria-label="Back to inbox"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <p className="text-sm font-bold text-highlight truncate min-w-0">{headerTitle}</p>
            </div>
          )}
          <div
            className="flex items-center gap-0.5 shrink-0"
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="p-1 hover:bg-foreground/10"
              aria-label="Collapse"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-foreground/10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isInbox ? (
          <div className="flex-1 overflow-y-auto min-h-0">
            <ul className="divide-y divide-foreground border-b border-foreground">
              {inboxThreadPreviews.map((t) => (
                <li key={t.peer}>
                  <Link
                    href={`/${t.peer}`}
                    onClick={() => onOpenPeer(t.peer)}
                    className="group/inboxrow block w-full cursor-pointer text-left py-3 px-3 hover:bg-foreground hover:text-background"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-bold text-highlight text-sm group-hover/inboxrow:text-background">
                        {t.peer}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0 group-hover/inboxrow:text-background/80">
                        {t.time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1 group-hover/inboxrow:text-background/80">
                      {t.preview}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-3 py-2 text-sm min-h-0">
              {messages.map((m, i) => {
                const label = m.from === 'self' ? selfUsername : peerUsername;
                const prev = messages[i - 1];
                const next = messages[i + 1];
                const showHeader = i === 0 || prev?.from !== m.from;
                const showTime = i === messages.length - 1 || next?.from !== m.from;
                return (
                  <div
                    key={m.id}
                    className={`max-w-[95%] min-w-0 ${showHeader ? (i === 0 ? '' : 'mt-4') : 'mt-1.5'}`}
                  >
                    {showHeader ? (
                      <p className="text-[10px] font-mono text-muted-foreground mb-1">{label}</p>
                    ) : null}
                    <p className="leading-snug text-foreground">{m.text}</p>
                    {showTime ? (
                      <p className="text-[10px] mt-1 tabular-nums text-muted-foreground">
                        {m.time}
                      </p>
                    ) : null}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="border-t-2 border-foreground p-2 shrink-0 flex gap-2 items-end">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                placeholder="Write a message…"
                className="flex-1 min-h-[40px] max-h-24 border border-foreground bg-background px-2 py-1.5 text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
              />
              <button
                type="button"
                onClick={send}
                disabled={!draft.trim()}
                className="shrink-0 border-2 border-foreground p-2 hover:bg-foreground hover:text-background disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
