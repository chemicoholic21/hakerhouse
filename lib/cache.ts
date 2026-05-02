// lib/cache.ts
import { getRedis } from "./redis"

/**
 * Cache wrapper that attempts to use Redis cache first, then falls back to fetcher.
 * Properly propagates errors from the fetcher while handling Redis failures gracefully.
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 30
): Promise<T> {
  let redisAvailable = true

  try {
    const redis = getRedis()
    const cached = await redis.get<T>(key)
    if (cached !== null) {
      return cached
    }
  } catch (redisError) {
    // Redis is unavailable, but we can still try the fetcher
    console.error("Redis cache read error, will fetch directly:", redisError)
    redisAvailable = false
  }

  // Fetch the data - let errors propagate to caller
  const data = await fetcher()

  // Try to cache the result if Redis is available
  if (redisAvailable) {
    try {
      const redis = getRedis()
      await redis.set(key, JSON.stringify(data), { ex: ttlSeconds })
    } catch (cacheWriteError) {
      // Log but don't fail - we have the data, just couldn't cache it
      console.error("Redis cache write error:", cacheWriteError)
    }
  }

  return data
}
