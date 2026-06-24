// lib/rate-limit.ts
// Simple in-memory rate limiting (no Redis required).
//
// LIMITATION (statelessness): the store below lives in a single process's
// memory. On a serverless/multi-instance deployment each instance keeps its
// own counters and they reset on cold start, so the effective limit scales
// with the number of instances and can be bypassed by spreading requests.
// This is acceptable as a basic abuse guard, but for real enforcement move the
// store to a shared backing service (e.g. Redis — already used by the
// github-data-pipeline) and keep this module's function signatures unchanged.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Extract client identifier for rate limiting
 * Uses X-Forwarded-For header (set by reverse proxies) or falls back to a default
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'anonymous';
  return ip;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Simple in-memory rate limiter
 */
export function checkRateLimitSimple(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Create new entry
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: entry.resetAt,
    };
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetAt,
  };
}

/**
 * Check API rate limit (30 requests per 10 seconds)
 */
export function checkApiRateLimit(identifier: string): RateLimitResult {
  return checkRateLimitSimple(identifier, 30, 10000);
}

/**
 * Check write rate limit (5 requests per 60 seconds)
 */
export function checkWriteRateLimit(identifier: string): RateLimitResult {
  return checkRateLimitSimple(identifier, 5, 60000);
}

/**
 * Create rate limit exceeded response with proper headers
 */
export function rateLimitExceededResponse(result: RateLimitResult): Response {
  return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.reset.toString(),
      'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
    },
  });
}
