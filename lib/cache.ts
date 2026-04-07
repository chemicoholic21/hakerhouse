import redis from "./redis"

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key)
    if (!data) return null
    return JSON.parse(data) as T
  } catch (error) {
    console.error("Redis get error:", error)
    return null
  }
}

export async function setCache(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  try {
    const data = JSON.stringify(value)
    await redis.set(key, data, "EX", ttlSeconds)
  } catch (error) {
    console.error("Redis set error:", error)
  }
}

export async function delCache(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error("Redis del error:", error)
  }
}
