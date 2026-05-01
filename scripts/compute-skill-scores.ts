/**
 * Skill Scoring Computation Script
 *
 * Usage:
 *   npm run db:compute-skills              # Full recompute
 *   npm run db:compute-skills -- --incremental  # Only compute for new users
 */
import { neon } from "@neondatabase/serverless"
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}
const sql = neon(process.env.DATABASE_URL)

// Check for incremental mode
const isIncremental = process.argv.includes('--incremental')
interface Skill {
  slug: string
  display_name: string
  match_languages: string[]
  match_topics: string[]
  match_keywords: string[]
}
interface TopRepo {
  // Various field names used across different data sources
  full_name?: string
  fullName?: string
  ownerLogin?: string
  owner?: string
  name?: string
  description?: string
  // Star counts - different field names
  stars?: number
  stargazersCount?: number  // GitHub API format
  stargazers_count?: number
  // PR counts
  userPRs?: number
  prs?: number
  // Fork counts
  forksCount?: number
  forks_count?: number
  // Language
  language?: string | null
  // Topics/categories
  topics?: string[]
  categories?: string[]
  // Other
  score?: number
  updatedAt?: string
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
 * Helper to get star count from various field names
 */
function getStarCount(repo: TopRepo): number {
  return repo.stars || repo.stargazersCount || repo.stargazers_count || 0
}

/**
 * Check if a repo matches a skill based on language, topics/categories, and keywords
 */
function repoMatchesSkill(repo: TopRepo, skill: Skill): boolean {
  // Check language match (case-insensitive)
  const repoLanguage = (repo.language || '').toLowerCase().trim()
  if (repoLanguage) {
    for (const lang of skill.match_languages) {
      if (repoLanguage === lang.toLowerCase()) {
        return true
      }
    }
  }

  // Check topic/category match (support both 'topics' and 'categories' fields)
  const repoTopics = (repo.topics || repo.categories || []).map(t => t.toLowerCase())
  for (const topic of skill.match_topics) {
    if (repoTopics.includes(topic.toLowerCase())) {
      return true
    }
  }

  // Check keyword match in repo name and description
  const repoName = (repo.full_name || repo.fullName || repo.name || '').toLowerCase()
  const repoDesc = (repo.description || '').toLowerCase()
  const searchText = `${repoName} ${repoDesc}`

  for (const keyword of skill.match_keywords) {
    const kw = keyword.toLowerCase()
    // Skip very short keywords (like ".c", ".h") for description matching to avoid false positives
    if (kw.length <= 2) {
      if (repoName.includes(kw)) {
        return true
      }
    } else {
      if (searchText.includes(kw)) {
        return true
      }
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
    // Use helper to get star count from various field names
    const stars = getStarCount(repo)
    // Support both 'userPRs' and 'prs' field names
    const prs = repo.userPRs || repo.prs || 1
    // Log scale for stars to reduce impact of outliers
    const starScore = stars > 0 ? Math.log10(stars + 1) * 10 : 0
    // PR contribution multiplier - more PRs = more expertise demonstrated
    const prMultiplier = Math.min(Math.log2(prs + 1) + 1, 3)
    // Base score for having a repo in this skill (even with 0 stars)
    const baseScore = 1
    totalScore += baseScore + (starScore * prMultiplier)
  }
  return Math.round(totalScore * 100) / 100
}
/**
 * Parse top_repos_json safely - handles both string JSON and already-parsed objects
 */
function parseTopRepos(jsonData: string | object | null): TopRepo[] {
  if (!jsonData) return []
  try {
    // If it's already an object/array, use it directly
    if (typeof jsonData === 'object') {
      if (Array.isArray(jsonData)) {
        return jsonData
      }
      return []
    }
    // If it's a string, parse it
    const parsed = JSON.parse(jsonData)
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
  console.log(`Starting skill score computation (mode: ${isIncremental ? 'incremental' : 'full'})...`)
  // 1. Get all skills
  console.log("Fetching skills...")
  const skills = await sql`SELECT * FROM skills` as Skill[]
  console.log(`Found ${skills.length} skills`)

  // 2. Get users with their repo data
  console.log("Fetching user analyses...")

  let users: UserAnalysis[]
  if (isIncremental) {
    // Only get users who don't have skill scores yet
    users = await sql`
      SELECT a.username, a.top_repos_json, a.languages_json
      FROM analyses a
      INNER JOIN leaderboard l ON a.username = l.username
      WHERE NOT EXISTS (
        SELECT 1 FROM user_skill_scores uss WHERE uss.username = a.username
      )
    ` as UserAnalysis[]
    console.log(`Found ${users.length} new users to process`)
  } else {
    users = await sql`
      SELECT a.username, a.top_repos_json, a.languages_json
      FROM analyses a
      INNER JOIN leaderboard l ON a.username = l.username
    ` as UserAnalysis[]
  }
  console.log(`Found ${users.length} users`)
  // Debug: show sample of raw data
  const sampleUser = users.find(u => u.top_repos_json)
  if (sampleUser) {
    console.log("\n=== DEBUG: Raw data analysis ===")
    console.log("Type of top_repos_json:", typeof sampleUser.top_repos_json)
    const rawStr = String(sampleUser.top_repos_json).substring(0, 500)
    console.log("First 500 chars of raw data:", rawStr)

    const repos = parseTopRepos(sampleUser.top_repos_json)
    console.log("Parsed repos count:", repos.length)
    if (repos.length > 0) {
      console.log("Fields in first repo:", Object.keys(repos[0]))
      console.log("Sample repo:", JSON.stringify(repos[0], null, 2))
      console.log("\nAll repos for sample user:")
      repos.forEach((repo, i) => {
        console.log(`  [${i}] name: ${repo.name}, language: "${repo.language}", stars: ${getStarCount(repo)}`)
      })
    }
  } else {
    console.log("\nWARNING: No users found with top_repos_json!")
  }

  // Debug: Check languages present in the data
  const languageCounts: Record<string, number> = {}
  let totalReposChecked = 0
  const usersWithRepoData = users.filter(u => {
    const repos = parseTopRepos(u.top_repos_json)
    return repos.length > 0
  })
  console.log(`\nUsers with parseable repo data: ${usersWithRepoData.length}`)

  for (const user of usersWithRepoData.slice(0, 100)) {
    const repos = parseTopRepos(user.top_repos_json)
    for (const repo of repos) {
      totalReposChecked++
      const lang = repo.language || 'null'
      languageCounts[lang] = (languageCounts[lang] || 0) + 1
    }
  }

  console.log(`\nLanguage distribution (first 100 users, ${totalReposChecked} repos):`)
  const sortedLangs = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
  for (const [lang, count] of sortedLangs) {
    console.log(`  ${lang}: ${count}`)
  }

  // Test matching with a specific skill
  console.log("\nTesting skill matching on sample repos:")
  const testSkills = skills.filter(s => ['javascript', 'python', 'typescript'].includes(s.slug))
  console.log(`Found ${testSkills.length} test skills to check`)
  for (const skill of testSkills) {
    let matchCount = 0
    for (const user of usersWithRepoData.slice(0, 100)) {
      const repos = parseTopRepos(user.top_repos_json)
      for (const repo of repos) {
        if (repoMatchesSkill(repo, skill)) {
          matchCount++
        }
      }
    }
    console.log(`  ${skill.slug}: ${matchCount} matches (match_languages: ${skill.match_languages.join(', ')})`)
  }
  console.log("=== END DEBUG ===")
  // 3. Compute scores for each user-skill pair
  console.log("\nComputing scores...")
  const allScores: UserSkillData[] = []
  let processed = 0
  let usersWithRepos = 0
  for (const user of users) {
    const repos = parseTopRepos(user.top_repos_json)
    if (repos.length > 0) {
      usersWithRepos++
    }
    for (const skill of skills) {
      const matchingRepos = repos.filter(repo => repoMatchesSkill(repo, skill))
      if (matchingRepos.length > 0) {
        const score = calculateSkillScore(matchingRepos)
        if (score > 0) {
          const topRepos = matchingRepos
            .sort((a, b) => getStarCount(b) - getStarCount(a))
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
    if (processed % 10000 === 0) {
      console.log(`Processed ${processed}/${users.length} users...`)
    }
  }
  console.log(`\nUsers with repo data: ${usersWithRepos}`)
  console.log(`Computed ${allScores.length} user-skill scores`)
  if (allScores.length === 0) {
    console.log("\nNo scores computed. Check if repo data has 'language' or 'topics' fields.")
    return
  }
  // 4. Save scores using batch inserts for efficiency
  console.log("\nSaving scores to database...")

  // Use larger batches with multi-row INSERT for efficiency
  const batchSize = 500
  let savedCount = 0
  let errorCount = 0

  for (let i = 0; i < allScores.length; i += batchSize) {
    const batch = allScores.slice(i, i + batchSize)

    // Build multi-row VALUES clause
    const values = batch.map(data =>
      `('${data.username.replace(/'/g, "''")}', '${data.skillSlug}', ${data.score}, ${data.repoCount}, '${JSON.stringify(data.topRepos).replace(/'/g, "''")}'::jsonb, NOW())`
    ).join(',\n')

    const query = `
      INSERT INTO user_skill_scores (username, skill_slug, score, repo_count, top_repos_json, computed_at)
      VALUES ${values}
      ON CONFLICT (username, skill_slug) DO UPDATE SET
        score = EXCLUDED.score,
        repo_count = EXCLUDED.repo_count,
        top_repos_json = EXCLUDED.top_repos_json,
        computed_at = NOW()
    `

    // Retry logic for transient errors
    let retries = 3
    while (retries > 0) {
      try {
        await sql(query)
        savedCount += batch.length
        break
      } catch (err) {
        retries--
        if (retries === 0) {
          console.error(`Failed to save batch at ${i}, skipping...`)
          errorCount += batch.length
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    if ((i + batchSize) % 5000 === 0 || i + batchSize >= allScores.length) {
      console.log(`Progress: ${Math.min(i + batchSize, allScores.length)}/${allScores.length} (saved: ${savedCount}, errors: ${errorCount})`)
    }
  }

  console.log(`\nDone! Saved ${savedCount} scores, ${errorCount} errors`)

  // Print stats
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
