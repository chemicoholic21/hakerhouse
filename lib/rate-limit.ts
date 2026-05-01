// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit"
import { getRedis } from "./redis"

// Rate limiter for API routes - 30 requests per 10 seconds per IP
let apiRateLimiter: Ratelimit | null = null

export function getApiRateLimiter(): Ratelimit {
  if (apiRateLimiter) return apiRateLimiter

  apiRateLimiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(30, "10 s"),
    analytics: true,
    prefix: "ratelimit:api",
  })

  return apiRateLimiter
}

// Stricter rate limiter for write operations (e.g., updating README)
let writeRateLimiter: Ratelimit | null = null

export function getWriteRateLimiter(): Ratelimit {
  if (writeRateLimiter) return writeRateLimiter

  writeRateLimiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
    prefix: "ratelimit:write",
  })

  return writeRateLimiter
}

/**
 * Extract client identifier for rate limiting
 * Uses X-Forwarded-For header (set by reverse proxies) or falls back to a default
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded?.split(",")[0]?.trim() || "anonymous"
  return ip
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check rate limit and return result
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<RateLimitResult> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier)
  return { success, limit, remaining, reset }
}

/**
 * Create rate limit exceeded response with proper headers
 */
export function rateLimitExceededResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
        "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
      },
    }
  )
}
