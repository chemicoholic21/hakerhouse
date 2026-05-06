import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

/**
 * GET /api/topics?q=search_term
 *
 * Searches for topics across:
 * 1. Skills table (display_name, match_topics, match_keywords)
 * 2. GitHub repo topics from github_repos.topics
 * 3. Unique skills from leaderboard.unique_skills_json
 *
 * Returns top 20 matching topics with user counts
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")?.toLowerCase().trim() || ""

  if (query.length < 2) {
    return NextResponse.json({ topics: [] })
  }

  try {
    // Search across multiple sources for matching topics
    const results = await sql`
      WITH
      -- 1. Get matching skills from skills table
      skill_matches AS (
        SELECT DISTINCT
          s.slug as topic,
          s.display_name as label,
          'skill' as source,
          COALESCE(
            (SELECT COUNT(*) FROM user_skill_scores uss WHERE uss.skill_slug = s.slug),
            0
          ) as user_count
        FROM skills s
        WHERE
          s.display_name ILIKE ${'%' + query + '%'}
          OR s.slug ILIKE ${'%' + query + '%'}
          OR EXISTS (
            SELECT 1 FROM unnest(s.match_topics) t WHERE t ILIKE ${'%' + query + '%'}
          )
          OR EXISTS (
            SELECT 1 FROM unnest(s.match_keywords) k WHERE k ILIKE ${'%' + query + '%'}
          )
      ),
      -- 2. Get matching topics from github_repos.topics array
      repo_topic_matches AS (
        SELECT DISTINCT
          topic as topic,
          topic as label,
          'repo' as source,
          COUNT(DISTINCT repo_name) as user_count
        FROM github_repos, unnest(topics) as topic
        WHERE topic ILIKE ${'%' + query + '%'}
        GROUP BY topic
        HAVING COUNT(DISTINCT repo_name) >= 3
      ),
      -- 3. Combine and deduplicate
      all_matches AS (
        SELECT topic, label, source, user_count FROM skill_matches
        UNION ALL
        SELECT topic, label, source, user_count FROM repo_topic_matches
        WHERE topic NOT IN (SELECT slug FROM skills)
      )
      SELECT
        topic,
        label,
        source,
        MAX(user_count) as user_count
      FROM all_matches
      GROUP BY topic, label, source
      ORDER BY MAX(user_count) DESC, label ASC
      LIMIT 20
    `

    interface TopicResult {
      topic: string
      label: string
      source: string
      user_count: number
    }

    const topics = (results as TopicResult[]).map((r) => ({
      value: r.topic,
      label: r.source === 'skill'
        ? `${r.label} (${r.user_count} devs)`
        : `${r.label} (${r.user_count} repos)`,
      source: r.source
    }))

    return NextResponse.json({ topics })
  } catch (error) {
    console.error("Error searching topics:", error)
    return NextResponse.json({ topics: [], error: "Failed to search topics" }, { status: 500 })
  }
}
