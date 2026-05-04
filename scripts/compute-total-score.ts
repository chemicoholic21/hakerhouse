/**
 * Total Score Computation Script with Contributor Efficiency
 *
 * This script recalculates the total_score for all users by combining:
 * 1. Base technical scores (ai_score, backend_score, frontend_score, devops_score, data_score)
 * 2. Contributor efficiency bonus (from user_scores.contributor_efficiency)
 *
 * The formula:
 *   baseTechnicalScore = (ai_score + backend_score + frontend_score + devops_score + data_score) / 5
 *   normalizedEfficiency = MIN(contributor_efficiency, maxEfficiencyBonus)
 *   total_score = baseTechnicalScore + normalizedEfficiency
 *
 * Usage:
 *   npm run db:compute-total-score
 *   npx tsx scripts/compute-total-score.ts
 */
import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

const sql = neon(process.env.DATABASE_URL)

// Configuration: Maximum bonus points from contributor efficiency
const MAX_EFFICIENCY_BONUS = 20

interface UserScore {
  username: string
  ai_score: number | null
  backend_score: number | null
  frontend_score: number | null
  devops_score: number | null
  data_score: number | null
  contributor_efficiency: number | null
  current_total_score: number | null
}

/**
 * Calculate new total score for a user
 */
function calculateNewTotalScore(user: UserScore): number {
  // Get base technical scores, defaulting to 0 if null
  const aiScore = user.ai_score || 0
  const backendScore = user.backend_score || 0
  const frontendScore = user.frontend_score || 0
  const devopsScore = user.devops_score || 0
  const dataScore = user.data_score || 0

  // Calculate average technical score
  const baseTechnicalScore = (aiScore + backendScore + frontendScore + devopsScore + dataScore) / 5

  // Add contributor efficiency as a bonus (capped at MAX_EFFICIENCY_BONUS)
  const contributorEfficiency = user.contributor_efficiency || 0
  const normalizedEfficiency = Math.min(contributorEfficiency, MAX_EFFICIENCY_BONUS)

  // Final score = base technical score + efficiency bonus
  const totalScore = baseTechnicalScore + normalizedEfficiency

  return Math.round(totalScore * 100) / 100 // Round to 2 decimal places
}

async function computeTotalScores(): Promise<void> {
  console.log("Starting total score computation with contributor efficiency...")
  console.log(`Max efficiency bonus: ${MAX_EFFICIENCY_BONUS} points`)

  // 1. Fetch all users with their scores from leaderboard and user_scores tables
  console.log("\nFetching user scores...")

  const users = await sql`
    SELECT
      l.username,
      l.ai_score,
      l.backend_score,
      l.frontend_score,
      l.devops_score,
      l.data_score,
      l.total_score as current_total_score,
      us.contributor_efficiency
    FROM leaderboard l
    LEFT JOIN user_scores us ON l.username = us.username
  ` as UserScore[]

  console.log(`Found ${users.length} users to process`)

  if (users.length === 0) {
    console.log("No users found. Exiting.")
    return
  }

  // 2. Calculate new scores and prepare updates
  console.log("\nCalculating new total scores...")

  let updatedCount = 0
  let errorCount = 0
  let unchangedCount = 0

  // Show sample calculations for first few users with efficiency bonus
  const usersWithEfficiency = users.filter(u => (u.contributor_efficiency || 0) > 0)
  console.log(`\nUsers with contributor efficiency: ${usersWithEfficiency.length}`)

  if (usersWithEfficiency.length > 0) {
    console.log("\nSample calculations (first 5 users with efficiency):")
    for (const user of usersWithEfficiency.slice(0, 5)) {
      const newScore = calculateNewTotalScore(user)
      const baseScore = ((user.ai_score || 0) + (user.backend_score || 0) +
                        (user.frontend_score || 0) + (user.devops_score || 0) +
                        (user.data_score || 0)) / 5
      const bonus = Math.min(user.contributor_efficiency || 0, MAX_EFFICIENCY_BONUS)
      console.log(`  ${user.username}:`)
      console.log(`    Base score: ${baseScore.toFixed(2)}`)
      console.log(`    Efficiency: ${user.contributor_efficiency?.toFixed(2) || 0} (capped bonus: ${bonus.toFixed(2)})`)
      console.log(`    New total: ${newScore}`)
      console.log(`    Previous: ${user.current_total_score || 0}`)
    }
  }

  // 3. Update scores one by one
  console.log("\nUpdating total scores in database...")

  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    const newTotalScore = calculateNewTotalScore(user)

    // Skip if score hasn't changed significantly (within 0.01)
    if (Math.abs(newTotalScore - (user.current_total_score || 0)) < 0.01) {
      unchangedCount++
      continue
    }

    try {
      await sql`
        UPDATE leaderboard
        SET
          total_score = ${newTotalScore},
          updated_at = NOW()
        WHERE username = ${user.username}
      `
      updatedCount++
    } catch (err) {
      errorCount++
      if (errorCount <= 3) {
        const error = err as Error
        console.error(`Error updating ${user.username}: ${error.message}`)
      }
    }

    // Progress indicator
    if ((i + 1) % 1000 === 0 || i + 1 === users.length) {
      console.log(`Progress: ${i + 1}/${users.length} (updated: ${updatedCount}, unchanged: ${unchangedCount}, errors: ${errorCount})`)
    }
  }

  // 4. Print summary
  console.log("\n=== Summary ===")
  console.log(`Total users processed: ${users.length}`)
  console.log(`Scores updated: ${updatedCount}`)
  console.log(`Scores unchanged: ${unchangedCount}`)
  console.log(`Errors: ${errorCount}`)

  // 5. Show top users by new total score
  const topUsers = await sql`
    SELECT
      l.username,
      l.total_score,
      l.ai_score,
      l.backend_score,
      l.frontend_score,
      l.devops_score,
      l.data_score,
      us.contributor_efficiency
    FROM leaderboard l
    LEFT JOIN user_scores us ON l.username = us.username
    ORDER BY l.total_score DESC
    LIMIT 10
  `

  console.log("\nTop 10 users by total score:")
  console.table(topUsers.map(u => ({
    username: u.username,
    total_score: Number(u.total_score).toFixed(2),
    efficiency: Number(u.contributor_efficiency || 0).toFixed(2),
    base_avg: (((u.ai_score || 0) + (u.backend_score || 0) + (u.frontend_score || 0) +
               (u.devops_score || 0) + (u.data_score || 0)) / 5).toFixed(2)
  })))
}

// Run the computation
computeTotalScores()
  .then(() => {
    console.log("\nTotal score computation completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Error computing total scores:", error)
    process.exit(1)
  })
