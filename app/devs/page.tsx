import { Header } from "@/components/header"
import { sql } from "@/lib/db"
import { DevsList, type DevRow } from "@/components/devs-list"
import { languages, countries } from "@/lib/data"
import { buildPageMetadata } from "@/lib/seo"
import { withCache } from "@/lib/cache"
import {
  buildWhereClause,
  validateCondition,
  getSkillJoinClause,
  getOrderByClause,
  getSkillSelectFragment,
  buildPaginationClause,
} from "@/lib/query-builder"

export const metadata = buildPageMetadata({
  title: "Developers",
  description: "Meet the developers building the future of open source.",
  path: "/devs",
})

const ITEMS_PER_PAGE = 50

interface SkillOption {
  value: string
  label: string
}

/**
 * Fetch skills list from the database
 * Only shows skills that have at least one user with a computed score
 */
async function getSkillsList(): Promise<SkillOption[]> {
  const skills = await sql`
    SELECT s.slug, s.display_name, COUNT(uss.username) as user_count
    FROM skills s
    INNER JOIN user_skill_scores uss ON s.slug = uss.skill_slug
    GROUP BY s.slug, s.display_name, s.category
    HAVING COUNT(uss.username) > 0
    ORDER BY
      CASE s.category
        WHEN 'language' THEN 1
        WHEN 'framework' THEN 2
        WHEN 'platform' THEN 3
        WHEN 'domain' THEN 4
        WHEN 'tool' THEN 5
        ELSE 6
      END,
      COUNT(uss.username) DESC
  `
  return [
    { value: 'all', label: 'All' },
    ...skills.map((s: any) => ({ value: s.slug, label: `${s.display_name} (${s.user_count})` }))
  ]
}

async function getDevs(
  page: number,
  filters: { skill?: string; language?: string; country?: string; openTo?: string; username?: string; location?: string; topic?: string }
) {
  const offset = (page - 1) * ITEMS_PER_PAGE

  // Check if we're filtering by skill using the new scoring system
  const useSkillScoring = !!(filters.skill && filters.skill !== 'all')

  // Base conditions - all conditions use parameterized values
  const conditions: string[] = []
  const params: any[] = []

  // When filtering by skill, we JOIN on user_skill_scores
  if (useSkillScoring) {
    const condition = `uss.skill_slug = $${params.length + 1}`
    if (validateCondition(condition)) {
      conditions.push(condition)
      params.push(filters.skill)
    }
  }

  if (filters.language && filters.language !== 'all') {
    const condition = `a.languages_json::text ILIKE $${params.length + 1}`
    if (validateCondition(condition)) {
      conditions.push(condition)
      params.push(`%${filters.language}%`)
    }
  }

  // Location filter - handles both country dropdown and freeform location search
  // Using filters.country for dropdown selection, filters.location for direct search
  const locationFilter = filters.country && filters.country !== 'all'
    ? filters.country
    : filters.location

  if (locationFilter) {
    const condition = `l.location ILIKE $${params.length + 1}`
    if (validateCondition(condition)) {
      conditions.push(condition)
      params.push(`%${locationFilter}%`)
    }
  }

  if (filters.topic) {
    const condition = `(l.unique_skills_json::text ILIKE $${params.length + 1} OR a.languages_json::text ILIKE $${params.length + 1})`
    if (validateCondition(condition)) {
      conditions.push(condition)
      params.push(`%${filters.topic}%`)
    }
  }

  if (filters.username) {
    const condition = `(l.username ILIKE $${params.length + 1} OR l.name ILIKE $${params.length + 1})`
    if (validateCondition(condition)) {
      conditions.push(condition)
      params.push(`%${filters.username}%`)
    }
  }

  // Use type-safe query fragments
  const whereClause = buildWhereClause(conditions)
  const skillJoin = getSkillJoinClause(useSkillScoring)
  const orderBy = getOrderByClause(useSkillScoring)
  const skillSelect = getSkillSelectFragment(useSkillScoring)
  const pagination = buildPaginationClause(ITEMS_PER_PAGE, offset)

  const [countResult, dbData] = await Promise.all([
    sql.query(
      `
      SELECT COUNT(*) as count
      FROM leaderboard l
      LEFT JOIN analyses a ON l.username = a.username
      ${skillJoin}
      ${whereClause}
      `,
      params
    ),
    sql.query(
      `
      SELECT
        l.name,
        l.username,
        l.location as country,
        ${skillSelect}
        l.total_score as score,
        l.unique_skills_json,
        a.languages_json
      FROM leaderboard l
      LEFT JOIN analyses a ON l.username = a.username
      ${skillJoin}
      ${whereClause}
      ${orderBy}
      ${pagination}
      `,
      params
    )
  ])

  const totalItems = Number(countResult[0].count)

  const devs: DevRow[] = dbData.map((row: any) => {
    let skills: string[] = []
    try {
      if (row.unique_skills_json) {
        skills = JSON.parse(row.unique_skills_json)
      }
    } catch (e) {
      console.error("Failed to parse skills for", row.username)
    }

    let language = "Unknown"
    try {
      if (row.languages_json) {
        const langs = JSON.parse(row.languages_json)
        if (Array.isArray(langs) && langs.length > 0) {
          language = langs[0]
        } else if (typeof langs === 'object') {
          language = Object.keys(langs)[0] || "Unknown"
        }
      }
    } catch (e) {
      console.error("Failed to parse languages for", row.username)
    }

    return {
      name: row.name || row.username,
      username: row.username,
      country: row.country || "Unknown",
      // When filtering by skill, show the skill-specific score
      score: row.skill_score ?? row.score ?? 0,
      skills: skills,
      language: language,
    }
  })

  return {
    devs,
    totalItems,
    totalPages: Math.ceil(totalItems / ITEMS_PER_PAGE)
  }
}

async function getCachedDevs(page: number, filters: any) {
  // Use v2 cache key to invalidate old cache entries
  const cacheKey = `devs:v2:p${page}:${JSON.stringify(filters)}`
  return withCache(cacheKey, () => getDevs(page, filters), 60)
}

async function getCachedSkillsList() {
  const cacheKey = 'skills:list:v1'
  return withCache(cacheKey, () => getSkillsList(), 300) // Cache for 5 minutes
}

export default async function DevsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const page = Number(resolvedParams.page) || 1
  const skill = typeof resolvedParams.skill === 'string' ? resolvedParams.skill : undefined
  const language = typeof resolvedParams.language === 'string' ? resolvedParams.language : undefined
  const country = typeof resolvedParams.country === 'string' ? resolvedParams.country : undefined
  const openTo = typeof resolvedParams.openTo === 'string' ? resolvedParams.openTo : undefined
  const username = typeof resolvedParams.username === 'string' ? resolvedParams.username : undefined
  const location = typeof resolvedParams.location === 'string' ? resolvedParams.location : undefined
  const topic = typeof resolvedParams.topic === 'string' ? resolvedParams.topic : undefined

  // Fetch devs and skills list in parallel
  const [{ devs, totalItems, totalPages }, skillsList] = await Promise.all([
    getCachedDevs(page, { skill, language, country, openTo, username, location, topic }),
    getCachedSkillsList()
  ])

  return (
    <div className="min-h-screen">
      <Header />

      <main className="layout-container py-8">
        <DevsList
          initialDevs={devs}
          skillsList={skillsList}
          languages={languages}
          countries={countries}
          pagination={{
            currentPage: page,
            totalPages,
            totalItems
          }}
        />
      </main>

      <footer className="border-t-2 border-dashed border-foreground/70 py-6">
        <div className="layout-container text-center text-sm">
          <p>
            © 2026 <span className="text-brand">hackerhou.se</span>. A home for <span className="text-highlight">human</span> programmers.
          </p>
        </div>
      </footer>
    </div>
  )
}
