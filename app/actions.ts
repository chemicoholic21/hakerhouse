// app/actions.ts
"use server"

import { sql } from "@/lib/db"
import { withCache } from "@/lib/cache"

export type MemberProfile = {
  username: string
  name: string
  location: string | null
  score: number
}

export async function getActiveMembers(limit = 20): Promise<MemberProfile[]> {
  return withCache(
    `members:active:${limit}`,
    async () => {
      const rows = await sql`
        SELECT username, name, location, total_score as score
        FROM leaderboard
        WHERE total_score > 0
        ORDER BY total_score DESC
        LIMIT ${limit}
      `
      return rows.map((r) => ({
        username: r.username,
        name: r.name || r.username,
        location: r.location,
        score: Number(r.score),
      }))
    },
    60
  )
}
