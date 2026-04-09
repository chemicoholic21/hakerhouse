// lib/cache.ts
import { redis } from "./redis"

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 30
): Promise<T> {
  try {
    const cached = await redis.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    await redis.set(key, JSON.stringify(data), { ex: ttlSeconds })
    return data
  } catch (error) {
    console.error("Redis cache error, falling through to fetcher:", error)
    return fetcher()
  }
}
