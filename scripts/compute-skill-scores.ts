/**
 * Skill Scoring Computation Script
 *
 * This script computes skill scores for all users based on their repository data.
 * It reads from the existing `analyses` table (which contains `top_repos_json`)
 * and populates the `user_skill_scores` table.
 *
 * Usage:
 *   npx tsx scripts/compute-skill-scores.ts
 *
 * The scoring algorithm:
 * 1. For each user, get their top_repos_json from the analyses table
 * 2. For each skill in the skills table, check if any repos match
 * 3. Calculate a score based on:
 *    - Stars of matching repos (log scale to reduce outliers)
 *    - Number of PRs contributed to matching repos
 *    - Whether the repo language matches the skill
 *    - Whether repo topics match the skill
 * 4. Store the score in user_skill_scores
 */

import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Run with: DATABASE_URL=... npx tsx scripts/compute-skill-scores.ts")
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
  ownerLogin?: string
  name?: string
  userPRs?: number
  stars?: number
  language?: string | null
  topics?: string[]
  score?: number
}

interface UserAnalysis {
  username: string
  top_repos_json: string | null
  languages_json: string | null
}

interface UserSkillData {
  username: string
  skillSlug: string
  score: number
  repoCount: number
  topRepos: TopRepo[]
}

/**
 * Check if a repo matches a skill based on language, topics, and keywords
 */
function repoMatchesSkill(repo: TopRepo, skill: Skill): boolean {
  // Check language match
  const repoLanguage = repo.language?.toLowerCase() || ''
  for (const lang of skill.match_languages) {
    if (repoLanguage === lang.toLowerCase()) {
      return true
    }
  }

  // Check topic match
  const repoTopics = (repo.topics || []).map(t => t.toLowerCase())
  for (const topic of skill.match_topics) {
    if (repoTopics.includes(topic.toLowerCase())) {
      return true
    }
  }

  // Check keyword match in repo name
  const repoName = (repo.full_name || repo.fullName || repo.name || '').toLowerCase()
  for (const keyword of skill.match_keywords) {
    if (repoName.includes(keyword.toLowerCase())) {
      return true
    }
  }

  return false
}

/**
 * Calculate score for a user-skill pair based on matching repos
 */
function calculateSkillScore(matchingRepos: TopRepo[]): number {
  if (matchingRepos.length === 0) return 0

  let totalScore = 0

  for (const repo of matchingRepos) {
    const stars = repo.stars || 0
    const prs = repo.userPRs || 1 // minimum 1 PR assumed

    // Log scale for stars to reduce impact of outliers
    // A repo with 1000 stars isn't 1000x more valuable than 1 star
    const starScore = stars > 0 ? Math.log10(stars + 1) * 10 : 0

    // PR contribution multiplier - more PRs = more expertise demonstrated
    const prMultiplier = Math.min(Math.log2(prs + 1) + 1, 3) // cap at 3x

    // Combined score for this repo
    const repoScore = starScore * prMultiplier

    totalScore += repoScore
  }

  // Round to 2 decimal places
  return Math.round(totalScore * 100) / 100
}

/**
 * Parse top_repos_json safely
 */
function parseTopRepos(jsonStr: string | null): TopRepo[] {
  if (!jsonStr) return []

  try {
    const parsed = JSON.parse(jsonStr)
    if (Array.isArray(parsed)) {
      return parsed
    }
    return []
  } catch {
    return []
  }
}

/**
 * Main computation function
 */
async function computeAllSkillScores(): Promise<void> {
  console.log("Starting skill score computation...")

  // 1. Get all skills
  console.log("Fetching skills...")
  const skills = await sql`SELECT * FROM skills` as Skill[]
  console.log(`Found ${skills.length} skills`)

  // 2. Get all users with their repo data
  console.log("Fetching user analyses...")
  const users = await sql`
    SELECT a.username, a.top_repos_json, a.languages_json
    FROM analyses a
    INNER JOIN leaderboard l ON a.username = l.username
  ` as UserAnalysis[]
  console.log(`Found ${users.length} users`)

  // 3. Compute scores for each user-skill pair
  console.log("Computing scores...")
  const allScores: UserSkillData[] = []
  let processed = 0

  for (const user of users) {
    const repos = parseTopRepos(user.top_repos_json)

    for (const skill of skills) {
      const matchingRepos = repos.filter(repo => repoMatchesSkill(repo, skill))

      if (matchingRepos.length > 0) {
        const score = calculateSkillScore(matchingRepos)

        // Only store if there's a meaningful score
        if (score > 0) {
          // Get top 5 repos for this skill
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

    processed++
    if (processed % 100 === 0) {
      console.log(`Processed ${processed}/${users.length} users...`)
    }
  }

  console.log(`Computed ${allScores.length} user-skill scores`)

  // 4. Clear existing scores and insert new ones (transactional)
  console.log("Saving scores to database...")

  // Delete all existing scores
  await sql`DELETE FROM user_skill_scores`

  // Insert in batches of 100
  const batchSize = 100
  for (let i = 0; i < allScores.length; i += batchSize) {
    const batch = allScores.slice(i, i + batchSize)

    for (const data of batch) {
      await sql`
        INSERT INTO user_skill_scores (username, skill_slug, score, repo_count, top_repos_json, computed_at)
        VALUES (
          ${data.username},
          ${data.skillSlug},
          ${data.score},
          ${data.repoCount},
          ${JSON.stringify(data.topRepos)}::jsonb,
          NOW()
        )
        ON CONFLICT (username, skill_slug) DO UPDATE SET
          score = EXCLUDED.score,
          repo_count = EXCLUDED.repo_count,
          top_repos_json = EXCLUDED.top_repos_json,
          computed_at = NOW()
      `
    }

    if ((i + batchSize) % 500 === 0 || i + batchSize >= allScores.length) {
      console.log(`Saved ${Math.min(i + batchSize, allScores.length)}/${allScores.length} scores...`)
    }
  }

  console.log("Done!")

  // Print some stats
  const stats = await sql`
    SELECT
      skill_slug,
      COUNT(*) as user_count,
      ROUND(AVG(score)::numeric, 2) as avg_score,
      ROUND(MAX(score)::numeric, 2) as max_score
    FROM user_skill_scores
    GROUP BY skill_slug
    ORDER BY user_count DESC
    LIMIT 10
  `

  console.log("\nTop 10 skills by user count:")
  console.table(stats)
}

// Run the computation
computeAllSkillScores()
  .then(() => {
    console.log("\nSkill score computation completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Error computing skill scores:", error)
    process.exit(1)
  })
