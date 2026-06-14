import { Header } from "@/components/header"
import { TrendingRepos } from "@/components/trending-repos"
import { buildPageMetadata } from "@/lib/seo"
import type { TrendingRepo } from "@/app/api/github/repos/route"
import { neon } from "@neondatabase/serverless"

export const metadata = buildPageMetadata({
  title: "Repositories",
  description: "Discover open source repositories ranked by contribution health scores.",
  path: "/repos",
})

export const dynamic = 'force-dynamic'

async function getInitialRepos(): Promise<{ repos: TrendingRepo[]; total: number }> {
  const sql = neon(process.env.DATABASE_URL!)

  const countResult = await sql`SELECT count(*) FROM repo_health WHERE gated_reason IS NULL`
  const total = parseInt(countResult[0].count, 10)

  const rows = await sql`
    SELECT
      full_name,
      owner_login,
      repo_name,
      primary_language,
      stars,
      is_archived,
      pushed_at,
      last_release_at,
      merged_pr_count,
      median_merge_hours,
      acceptance_rate,
      merge_velocity_per_month,
      open_issues_count,
      good_first_issues,
      help_wanted_issues,
      has_contributing,
      has_code_of_conduct,
      mentionable_users,
      contribution_score,
      responsiveness_score,
      throughput_score,
      acceptance_score,
      newcomer_score,
      liveness_score,
      confidence,
      gated_reason
    FROM repo_health
    WHERE gated_reason IS NULL
    ORDER BY contribution_score DESC NULLS LAST
    LIMIT 30
  `

  const repos: TrendingRepo[] = rows.map((row) => ({
    name: row.repo_name,
    fullName: row.full_name,
    owner: row.owner_login,
    stars: row.stars,
    language: row.primary_language,
    url: `https://github.com/${row.full_name}`,
    contributionScore: row.contribution_score,
    responsivenessScore: row.responsiveness_score,
    throughputScore: row.throughput_score,
    acceptanceScore: row.acceptance_score,
    newcomerScore: row.newcomer_score,
    livenessScore: row.liveness_score,
    confidence: row.confidence,
    mergedPrCount: row.merged_pr_count,
    medianMergeHours: row.median_merge_hours,
    acceptanceRate: row.acceptance_rate,
    openIssuesCount: row.open_issues_count,
    goodFirstIssues: row.good_first_issues,
    helpWantedIssues: row.help_wanted_issues,
    hasContributing: row.has_contributing,
    hasCodeOfConduct: row.has_code_of_conduct,
    mentionableUsers: row.mentionable_users,
    isArchived: row.is_archived,
    pushedAt: row.pushed_at,
    lastReleaseAt: row.last_release_at,
    mergeVelocityPerMonth: row.merge_velocity_per_month,
    gatedReason: row.gated_reason,
  }))

  return { repos, total }
}

export default async function ReposPage() {
  const { repos, total } = await getInitialRepos()

  return (
    <div className="min-h-screen">
      <Header />

      <main className="layout-container py-8">
        <TrendingRepos initialRepos={repos} initialTotal={total} />
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
