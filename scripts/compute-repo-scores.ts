/**
 * Repo Score Computation Script
 *
 * Computes repo_score for each user-repo pair using the PR TTM formula:
 *
 *   Repo Score = log₁₀(Total PRs + 1) × (72 / (Median TTM + 72)) × Scale
 *
 * Where:
 *   - Total PRs = total number of PRs in the repo (from github_repos.total_prs)
 *   - Median TTM = median time-to-merge in hours for merged PRs in the repo
 *   - Scale = configurable multiplier (default: 10)
 *   - The TTM factor (72 / (Median TTM + 72)) rewards repos with faster merge times
 *     - At 0 hours TTM: factor = 1.0 (max)
 *     - At 72 hours (3 days) TTM: factor = 0.5
 *     - At 144 hours (6 days) TTM: factor = 0.33
 *     - Higher TTM = lower factor (slower repos get penalized)
 *
 * Usage:
 *   npm run db:compute-repo-scores
 *   npx tsx scripts/compute-repo-scores.ts
 */
import { config } from "dotenv"
import { neon } from "@neondatabase/serverless"

// Load environment variables from .env file
config()

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Make sure you have a .env file with DATABASE_URL defined.")
}

const sql = neon(process.env.DATABASE_URL)

// Configuration
const SCALE = 100 // Score multiplier (increased for more granularity)
const TTM_HALF_LIFE_HOURS = 72 // Hours at which TTM factor = 0.5 (3 days)
const DEFAULT_TTM_HOURS = 168 // Default TTM if no merged PRs (7 days)

interface RepoTTM {
  repo_name: string
  median_ttm_hours: number
  merged_pr_count: number
}

interface RepoData {
  repo_name: string
  total_prs: number
  stars: number
}

interface UserRepo {
  username: string
  repo_name: string
  user_prs: number
}

/**
 * Calculate the repo score using the formula:
 * Repo Score = log₁₀(Total PRs + 1) × (72 / (Median TTM + 72)) × Scale
 */
function calculateRepoScore(totalPRs: number, medianTTMHours: number): number {
  // PR factor: log₁₀(Total PRs + 1)
  const prFactor = Math.log10(totalPRs + 1)

  // TTM factor: 72 / (Median TTM + 72)
  // This gives 1.0 at 0 hours, 0.5 at 72 hours, and approaches 0 for very slow repos
  const ttmFactor = TTM_HALF_LIFE_HOURS / (medianTTMHours + TTM_HALF_LIFE_HOURS)

  // Final score
  const score = prFactor * ttmFactor * SCALE

  return Math.round(score * 1000) / 1000 // Round to 3 decimal places
}

/**
 * Calculate median of an array of numbers
 */
function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

async function computeRepoScores(): Promise<void> {
  console.log("=== Repo Score Computation ===")
  console.log(`Formula: log₁₀(Total PRs + 1) × (${TTM_HALF_LIFE_HOURS} / (Median TTM + ${TTM_HALF_LIFE_HOURS})) × ${SCALE}`)
  console.log(`Default TTM for repos without merged PRs: ${DEFAULT_TTM_HOURS} hours\n`)

  // 1. Calculate median TTM per repo from github_pull_requests
  console.log("Step 1: Calculating median TTM per repo from merged PRs...")

  const ttmData = await sql`
    SELECT
      repo_name,
      ARRAY_AGG(
        EXTRACT(EPOCH FROM (merged_at - created_at)) / 3600
      ) as ttm_hours_array,
      COUNT(*) as merged_pr_count
    FROM github_pull_requests
    WHERE merged_at IS NOT NULL
      AND created_at IS NOT NULL
      AND merged_at > created_at
    GROUP BY repo_name
  ` as Array<{ repo_name: string; ttm_hours_array: number[]; merged_pr_count: number }>

  // Build a map of repo -> median TTM
  const repoTTMMap = new Map<string, RepoTTM>()
  for (const row of ttmData) {
    const ttmValues = row.ttm_hours_array.filter(v => v > 0 && v < 8760) // Filter out invalid values (> 1 year)
    if (ttmValues.length > 0) {
      repoTTMMap.set(row.repo_name, {
        repo_name: row.repo_name,
        median_ttm_hours: median(ttmValues),
        merged_pr_count: ttmValues.length
      })
    }
  }

  console.log(`  Found TTM data for ${repoTTMMap.size} repos`)

  // Show some TTM stats
  if (repoTTMMap.size > 0) {
    const allTTMs = Array.from(repoTTMMap.values()).map(r => r.median_ttm_hours)
    console.log(`  Median TTM across all repos: ${median(allTTMs).toFixed(1)} hours`)
    console.log(`  Min TTM: ${Math.min(...allTTMs).toFixed(1)} hours`)
    console.log(`  Max TTM: ${Math.max(...allTTMs).toFixed(1)} hours`)
  }

  // 2. Get repo data (total PRs, stars)
  console.log("\nStep 2: Fetching repo data from github_repos...")

  const repoData = await sql`
    SELECT repo_name, total_prs, stars
    FROM github_repos
    WHERE total_prs > 0
  ` as RepoData[]

  console.log(`  Found ${repoData.length} repos with PR data`)

  // Build repo data map
  const repoDataMap = new Map<string, RepoData>()
  for (const repo of repoData) {
    repoDataMap.set(repo.repo_name, repo)
  }

  // 3. Get all user-repo pairs from user_repo_scores WITH total_prs from github_repos
  console.log("\nStep 3: Fetching user-repo pairs with joined repo data...")

  const userRepos = await sql`
    SELECT
      urs.username,
      urs.repo_name,
      urs.user_prs,
      COALESCE(gr.total_prs, urs.total_prs, 0) as total_prs,
      COALESCE(gr.stars, urs.stars, 0) as stars
    FROM user_repo_scores urs
    LEFT JOIN github_repos gr ON urs.repo_name = gr.repo_name
  ` as (UserRepo & { total_prs: number; stars: number })[]

  console.log(`  Found ${userRepos.length} user-repo pairs to update`)

  // Debug: Check data quality
  const withTotalPRs = userRepos.filter(r => r.total_prs > 0).length
  const withTTM = userRepos.filter(r => repoTTMMap.has(r.repo_name)).length
  console.log(`  Repos with total_prs > 0: ${withTotalPRs}`)
  console.log(`  Repos with TTM data: ${withTTM}`)

  // Show sample repos
  if (userRepos.length > 0) {
    const samples = userRepos.filter(r => r.total_prs > 0).slice(0, 3)
    console.log(`  Sample repos with PRs:`)
    for (const s of samples) {
      const ttm = repoTTMMap.get(s.repo_name)
      console.log(`    ${s.repo_name}: ${s.total_prs} PRs, TTM: ${ttm?.median_ttm_hours?.toFixed(1) || 'N/A'}h`)
    }
  }

  // 4. Calculate and update scores
  console.log("\nStep 4: Computing and updating repo scores...")

  let updatedCount = 0
  let skippedCount = 0
  let errorCount = 0

  // Show sample calculations
  console.log("\nSample calculations (first 5):")
  let sampleCount = 0

  for (let i = 0; i < userRepos.length; i++) {
    const userRepo = userRepos[i]
    const ttmInfo = repoTTMMap.get(userRepo.repo_name)

    // total_prs comes from the joined query (COALESCE of github_repos and user_repo_scores)
    const totalPRs = userRepo.total_prs

    if (totalPRs === 0) {
      skippedCount++
      continue
    }

    // Get median TTM, use default if not available
    const medianTTM = ttmInfo?.median_ttm_hours || DEFAULT_TTM_HOURS

    // Calculate the score
    const repoScore = calculateRepoScore(totalPRs, medianTTM)

    // Show sample
    if (sampleCount < 5 && ttmInfo) {
      const prFactor = Math.log10(totalPRs + 1)
      const ttmFactor = TTM_HALF_LIFE_HOURS / (medianTTM + TTM_HALF_LIFE_HOURS)
      console.log(`  ${userRepo.repo_name}:`)
      console.log(`    Total PRs: ${totalPRs}, Median TTM: ${medianTTM.toFixed(1)}h`)
      console.log(`    PR Factor: ${prFactor.toFixed(3)}, TTM Factor: ${ttmFactor.toFixed(3)}`)
      console.log(`    Score: ${prFactor.toFixed(3)} × ${ttmFactor.toFixed(3)} × ${SCALE} = ${repoScore}`)
      sampleCount++
    }

    // Update the score in database
    try {
      await sql`
        UPDATE user_repo_scores
        SET
          repo_score = ${repoScore},
          total_prs = ${totalPRs},
          computed_at = NOW()
        WHERE username = ${userRepo.username} AND repo_name = ${userRepo.repo_name}
      `
      updatedCount++
    } catch (err) {
      errorCount++
      if (errorCount <= 3) {
        const error = err as Error
        console.error(`  Error updating ${userRepo.username}/${userRepo.repo_name}: ${error.message}`)
      }
    }

    // Progress indicator
    if ((i + 1) % 1000 === 0 || i + 1 === userRepos.length) {
      console.log(`Progress: ${i + 1}/${userRepos.length} (updated: ${updatedCount}, skipped: ${skippedCount}, errors: ${errorCount})`)
    }
  }

  // 5. Print summary
  console.log("\n=== Summary ===")
  console.log(`Total user-repo pairs: ${userRepos.length}`)
  console.log(`Updated: ${updatedCount}`)
  console.log(`Skipped (no PR data): ${skippedCount}`)
  console.log(`Errors: ${errorCount}`)

  // 6. Show top repos by score
  const topRepos = await sql`
    SELECT
      urs.repo_name,
      urs.repo_score,
      urs.total_prs,
      gr.stars
    FROM user_repo_scores urs
    LEFT JOIN github_repos gr ON urs.repo_name = gr.repo_name
    WHERE urs.repo_score > 0
    ORDER BY urs.repo_score DESC
    LIMIT 10
  `

  console.log("\nTop 10 repos by score:")
  console.table(topRepos.map(r => ({
    repo: r.repo_name,
    score: Number(r.repo_score).toFixed(2),
    total_prs: r.total_prs,
    stars: r.stars || 0
  })))

  // 7. Show score distribution (adjusted for Scale=100)
  const distribution = await sql`
    SELECT
      score_range,
      count
    FROM (
      SELECT
        CASE
          WHEN repo_score = 0 OR repo_score IS NULL THEN '0'
          WHEN repo_score < 10 THEN '0-10'
          WHEN repo_score < 50 THEN '10-50'
          WHEN repo_score < 100 THEN '50-100'
          WHEN repo_score < 200 THEN '100-200'
          WHEN repo_score < 500 THEN '200-500'
          ELSE '500+'
        END as score_range,
        CASE
          WHEN repo_score = 0 OR repo_score IS NULL THEN 0
          WHEN repo_score < 10 THEN 1
          WHEN repo_score < 50 THEN 2
          WHEN repo_score < 100 THEN 3
          WHEN repo_score < 200 THEN 4
          WHEN repo_score < 500 THEN 5
          ELSE 6
        END as sort_order,
        COUNT(*) as count
      FROM user_repo_scores
      GROUP BY 1, 2
    ) sub
    ORDER BY sort_order
  `

  console.log("\nScore distribution:")
  console.table(distribution)
}

// Run the computation
computeRepoScores()
  .then(() => {
    console.log("\nRepo score computation completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Error computing repo scores:", error)
    process.exit(1)
  })
