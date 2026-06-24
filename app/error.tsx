'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Route-level error boundary. Catches unexpected runtime errors thrown while
 * rendering a page and shows a recoverable fallback instead of a blank screen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for observability (server logs / error tracking).
    console.error('Unhandled page error:', error);
  }, [error]);

  return (
    <main className="layout-container py-16">
      <div className="border-2 border-dashed border-foreground/70 p-8 max-w-xl">
        <h1 className="text-2xl font-bold text-highlight mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          An unexpected error occurred while loading this page. You can try again, or head back to
          the homepage.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={reset}
            className="border border-foreground px-4 py-2 text-sm hover:bg-foreground hover:text-background"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border border-foreground/40 px-4 py-2 text-sm hover:bg-foreground/5"
          >
            Go home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-muted-foreground font-mono">Error ID: {error.digest}</p>
        )}
      </div>
    </main>
  );
}
