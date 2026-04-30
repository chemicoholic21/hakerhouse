
/**
 * Skill Scoring Computation Script
 *
 * Usage: npm run db:compute-skills
 */

import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

const sql = neon(process.env.DATABASE_URL)

interface Skill {
  slug: string
  display_name: string
  match_languages: string[]
  match_topics: string[]
  match_keywords: string[]
}

interface TopRepo {
  full_name?: string
  fullName?: string
  name?: string
  userPRs?: number
  stars?: number
  language?: string | null
  topics?: string[]
}

interface UserAnalysis {
  username: string
  top_repos_json: string | null
}

function repoMatchesSkill(repo: TopRepo, skill: Skill): boolean {
  const repoLanguage = repo.language?.toLowerCase() || ''
  for (const lang of skill.match_languages) {
    if (repoLanguage === lang.toLowerCase()) return true
  }

  const repoTopics = (repo.topics || []).map(t => t.toLowerCase())
  for (const topic of skill.match_topics) {
    if (repoTopics.includes(topic.toLowerCase())) return true
  }

  const repoName = (repo.full_name || repo.fullName || repo.name || '').toLowerCase()
  for (const keyword of skill.match_keywords) {
    if (repoName.includes(keyword.toLowerCase())) return true
  }

  return false
}

function calculateSkillScore(matchingRepos: TopRepo[]): number {
  if (matchingRepos.length === 0) return 0

  let totalScore = 0
  for (const repo of matchingRepos) {
    const stars = repo.stars || 0
    const prs = repo.userPRs || 1
    const starScore = stars > 0 ? Math.log10(stars + 1) * 10 : 0
    const prMultiplier = Math.min(Math.log2(prs + 1) + 1, 3)
    totalScore += starScore * prMultiplier
  }

  return Math.round(totalScore * 100) / 100
}

function parseTopRepos(jsonStr: string | null): TopRepo[] {
  if (!jsonStr) return []
  try {
    const parsed = JSON.parse(jsonStr)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function computeAllSkillScores(): Promise<void> {
  console.log("Starting skill score computation...")

  const skills = await sql`SELECT * FROM skills` as Skill[]
  console.log(`Found ${skills.length} skills`)

  const users = await sql`
    SELECT a.username, a.top_repos_json
    FROM analyses a
    INNER JOIN leaderboard l ON a.username = l.username
  ` as UserAnalysis[]
  console.log(`Found ${users.length} users`)

  console.log("Computing scores...")
  const allScores: { username: string; skillSlug: string; score: number; repoCount: number; topRepos: TopRepo[] }[] = []

  for (const user of users) {
    const repos = parseTopRepos(user.top_repos_json)

    for (const skill of skills) {
      const matchingRepos = repos.filter(repo => repoMatchesSkill(repo, skill))

      if (matchingRepos.length > 0) {
        const score = calculateSkillScore(matchingRepos)
        if (score > 0) {
          const topRepos = matchingRepos
            .sort((a, b) => (b.stars || 0) - (a.stars || 0))
            .slice(0, 5)

          allScores.push({
            username: user.username,
            skillSlug: skill.slug,
            score,
            repoCount: matchingRepos.length,
            topRepos,
          })
        }
      }
    }
  }

  console.log(`Computed ${allScores.length} user-skill scores`)

  await sql`DELETE FROM user_skill_scores`

  for (const data of allScores) {
    await sql`
      INSERT INTO user_skill_scores (username, skill_slug, score, repo_count, top_repos_json, computed_at)
      VALUES (${data.username}, ${data.skillSlug}, ${data.score}, ${data.repoCount}, ${JSON.stringify(data.topRepos)}::jsonb, NOW())
    `
  }

  console.log("Done!")

  const stats = await sql`
    SELECT skill_slug, COUNT(*) as user_count, ROUND(AVG(score)::numeric, 2) as avg_score
    FROM user_skill_scores
    GROUP BY skill_slug
    ORDER BY user_count DESC
    LIMIT 10
  `
  console.log("\nTop 10 skills by user count:")
  console.table(stats)
}

computeAllSkillScores()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1) })