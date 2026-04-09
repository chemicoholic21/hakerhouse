// lib/redis.ts
import { Redis } from "@upstash/redis"

let redis: Redis | null = null

export function getRedis(): Redis {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL is not set. " +
      "Get your Upstash credentials at https://console.upstash.com"
    )
  }

  if (!token) {
    throw new Error(
      "UPSTASH_REDIS_REST_TOKEN is not set. " +
      "Get your Upstash credentials at https://console.upstash.com"
    )
  }

  redis = new Redis({ url, token })
  return redis
}
