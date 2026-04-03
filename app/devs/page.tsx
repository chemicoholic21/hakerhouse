import { Header } from "@/components/header"
import { sql } from "@/lib/db"
import { DevsList, type DevRow } from "@/components/devs-list"
import { languages, countries, skillsList } from "@/lib/data"
import { unstable_cache } from "next/cache"
import { buildPageMetadata } from "@/lib/seo"

export const metadata = buildPageMetadata({
  title: "Developers",
  description: "Meet the developers building the future of open source.",
  path: "/devs",
})

const ITEMS_PER_PAGE = 50

async function getDevs(
  page: number, 
  filters: { skill?: string; language?: string; country?: string; openTo?: string; username?: string; location?: string; topic?: string }
) {
  const offset = (page - 1) * ITEMS_PER_PAGE
  
  // Base conditions
  const conditions: string[] = []
  const params: any[] = []

  // Note: We use string matching for JSON fields as a simple optimization 
  // without knowing the exact DB schema extensions (GIN indexes, etc).
  if (filters.skill && filters.skill !== 'all') {
    conditions.push(`l.unique_skills_json::text ILIKE $${params.length + 1}`)
    params.push(`%${filters.skill}%`)
  }

  if (filters.language && filters.language !== 'all') {
    conditions.push(`a.languages_json::text ILIKE $${params.length + 1}`)
    params.push(`%${filters.language}%`)
  }

  if (filters.country && filters.country !== 'all') {
    conditions.push(`l.location ILIKE $${params.length + 1}`)
    params.push(`%${filters.country}%`)
  }

  if (filters.location) {
    conditions.push(`l.location ILIKE $${params.length + 1}`)
    params.push(`%${filters.location}%`)
  }

  if (filters.topic) {
    conditions.push(`(l.unique_skills_json::text ILIKE $${params.length + 1} OR a.languages_json::text ILIKE $${params.length + 1})`)
    params.push(`%${filters.topic}%`)
  }

  if (filters.username) {
    conditions.push(`(l.username ILIKE $${params.length + 1} OR l.name ILIKE $${params.length + 1})`)
    params.push(`%${filters.username}%`)
  }

  // "openTo" logic could be added here if the DB supports it. 
  // For now we ignore it or implement a placeholder if field exists.

  const whereClause = conditions.length > 0 
    ? 'WHERE ' + conditions.join(' AND ') 
    : ''

  // Execute Count and Data queries in parallel
  const [countResult, dbData] = await Promise.all([
    sql.query(
      `
      SELECT COUNT(*) as count
      FROM leaderboard l
      LEFT JOIN analyses a ON l.username = a.username
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
        l.total_score as score,
        l.unique_skills_json,
        a.languages_json
      FROM leaderboard l
      LEFT JOIN analyses a ON l.username = a.username
      ${whereClause}
      ORDER BY l.total_score DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
      `,
      params
    )
  ])

  const totalItems = Number(countResult[0].count)

  // Process only the fetched page
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
      score: row.score || 0,
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

// Wrap in cache
const getCachedDevs = unstable_cache(
  async (page, filters) => getDevs(page, filters),
  ['devs-list-v1'], 
  { revalidate: 60, tags: ['devs'] }
)

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

  const { devs, totalItems, totalPages } = await getCachedDevs(page, { skill, language, country, openTo, username, location, topic })

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
