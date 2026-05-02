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
 *
 * Security note: X-Forwarded-For can be spoofed by clients. In production with
 * a trusted proxy (like Vercel, Cloudflare), the rightmost IP is the most reliable
 * as it's added by the first trusted proxy. For additional security, we also
 * incorporate the User-Agent to make simple bypass attempts harder.
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const userAgent = request.headers.get("user-agent") || ""

  // Get the client IP - prefer the rightmost non-private IP as it's added by the trusted proxy
  // For simple setups, fall back to the first IP
  let ip = "anonymous"
  if (forwarded) {
    const ips = forwarded.split(",").map(s => s.trim()).filter(Boolean)
    // Use last IP (most recently added by trusted proxy) if available
    // Fall back to first IP for simpler proxy setups
    ip = ips[ips.length - 1] || ips[0] || "anonymous"
  }

  // Empty string check - don't accept empty IPs
  if (!ip || ip.length === 0) {
    ip = "anonymous"
  }

  // Combine with user agent hash to make simple spoofing harder
  // This isn't foolproof but raises the bar for bypass attempts
  const identifier = `${ip}:${userAgent.slice(0, 50)}`
  return identifier
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
