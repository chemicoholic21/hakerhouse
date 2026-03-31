import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { UserProfileView } from "@/components/user-profile-view"
import { sql } from "@/lib/db"
import { buildPageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username: raw } = await params
  const username = decodeURIComponent(raw)
  
  const [dev] = await sql`
    SELECT name, username FROM leaderboard WHERE username = ${username}
  `
  
  if (!dev) return buildPageMetadata({ title: "Profile", path: `/${username}` })
  
  return buildPageMetadata({
    title: `${dev.name || dev.username}`,
    description: `View ${dev.name || dev.username}'s profile on Kerhouse.`,
    path: `/${username}`,
  })
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username: raw } = await params
  const username = decodeURIComponent(raw)
  
  const [dbData] = await sql`
    SELECT 
      l.*,
      a.languages_json,
      a.contribution_count,
      a.top_repos_json,
      (SELECT COUNT(*) + 1 FROM leaderboard l2 WHERE l2.total_score > l.total_score) as rank
    FROM leaderboard l
    LEFT JOIN analyses a ON l.username = a.username
    WHERE l.username = ${username}
  `

  if (!dbData) notFound()

  // Parse unique_skills_json safely
  let skills: string[] = []
  try {
    if (dbData.unique_skills_json) {
      skills = JSON.parse(dbData.unique_skills_json)
    }
  } catch (e) {
    console.error("Failed to parse skills", e)
  }

  // Split skills into strong and also
  const skillsStrong = skills.slice(0, 3)
  const skillsAlso = skills.slice(3)

  // Parse languages_json to get primary language
  let language = "Unknown"
  try {
    if (dbData.languages_json) {
      const langs = JSON.parse(dbData.languages_json)
      if (Array.isArray(langs) && langs.length > 0) {
        language = langs[0]
      } else if (typeof langs === 'object') {
        language = Object.keys(langs)[0] || "Unknown"
      }
    }
  } catch (e) {
    console.error("Failed to parse languages", e)
  }

  // Parse top_repos_json into contributions
  let contributions: any[] | undefined = undefined
  try {
    if (dbData.top_repos_json) {
      const repos = JSON.parse(dbData.top_repos_json)
      if (Array.isArray(repos)) {
        contributions = repos.map((r: any) => {
          const repoName = r.full_name || (r.ownerLogin ? `${r.ownerLogin}/${r.name}` : r.name)
          const prCount = r.userPRs || 0
          const stars = r.stars || 0
          
          return {
            kind: "commit", // Default to commit as we don't have specific types for each
            repo: repoName,
            title: `${prCount} PR${prCount !== 1 ? 's' : ''} contributed · ${stars.toLocaleString()} stars`,
            time: r.language || "Recent",
            score: r.score,
          }
        })
      }
    }
  } catch (e) {
    console.error("Failed to parse top repos", e)
  }

  const dev = {
    name: dbData.name || dbData.username,
    username: dbData.username,
    skills: skills,
    repos: dbData.contribution_count || 0,
    followers: 0,
    language: language,
    country: dbData.location || "Unknown",
  }

  return (
    <div className="min-h-screen">
      <Header />
      <UserProfileView 
        dev={dev} 
        bio={dbData.bio}
        weeklyRank={Number(dbData.rank)}
        weeklyScore={dbData.total_score}
        skillsStrong={skillsStrong}
        skillsAlso={skillsAlso}
        contributions={contributions}
        scores={{
          backend: dbData.backend_score,
          frontend: dbData.frontend_score,
          devops: dbData.devops_score,
          data: dbData.data_score,
          ai: dbData.ai_score,
        }}
      />
    </div>
  )
}
