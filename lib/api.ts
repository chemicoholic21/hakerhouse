// lib/api.ts
// Shared helpers for consistent API responses.
//
// Every route returns errors in the same shape — { error: string } — with a
// safe, human-readable message. Internal error details are logged server-side
// and never sent to the client (avoids leaking stack traces / SQL / infra).

import { NextResponse } from 'next/server';

export interface ApiErrorBody {
  error: string;
}

/** Return a consistent client-facing error response. */
export function apiError(message: string, status: number): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Log an unexpected error server-side and return a generic 500.
 * Use for caught exceptions whose details must not reach the client.
 */
export function serverError(context: string, error: unknown): NextResponse<ApiErrorBody> {
  console.error(`[api] ${context}:`, error);
  return apiError('Internal server error', 500);
}
