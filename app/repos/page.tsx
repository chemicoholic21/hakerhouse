import { Header } from "@/components/header"
import { TrendingRepos } from "@/components/trending-repos"
import { buildPageMetadata } from "@/lib/seo"
import type { TrendingRepo } from "@/app/api/github/repos/route"

export const metadata = buildPageMetadata({
  title: "Repositories",
  description: "Discover trending open source repositories and projects.",
  path: "/repos",
})

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = 'force-dynamic'

interface GitHubRepo {
  name: string
  nameWithOwner: string
  description: string | null
  stargazerCount: number
  forkCount: number
  url: string
  primaryLanguage: {
    name: string
    color: string
  } | null
  repositoryTopics: {
    nodes: Array<{
      topic: {
        name: string
      }
    }>
  }
  createdAt: string
}

interface GraphQLResponse {
  data?: {
    search: {
      nodes: GitHubRepo[]
      pageInfo: {
        hasNextPage: boolean
        endCursor: string | null
      }
    }
  }
  errors?: Array<{ message: string }>
}

interface FetchResult {
  repos: TrendingRepo[]
  pageInfo: {
    hasNextPage: boolean
    endCursor: string | null
  }
}

async function fetchTrendingRepos(): Promise<FetchResult> {
  const token = process.env.GITHUB_TOKEN

  if (!token) {
    console.error("GITHUB_TOKEN is not set. Available env vars:", Object.keys(process.env).filter(k => k.includes('GITHUB') || k.includes('TOKEN')))
    return { repos: [], pageInfo: { hasNextPage: false, endCursor: null } }
  }

  console.log("Fetching trending repos with token starting with:", token.substring(0, 10) + "...")

  // Get repos created in the last 30 days, sorted by stars
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const dateStr = thirtyDaysAgo.toISOString().split("T")[0]

  const query = `
    query {
      search(query: "created:>${dateStr} stars:>100 sort:stars-desc", type: REPOSITORY, first: 30) {
        nodes {
          ... on Repository {
            name
            nameWithOwner
            description
            stargazerCount
            forkCount
            url
            primaryLanguage {
              name
              color
            }
            repositoryTopics(first: 5) {
              nodes {
                topic {
                  name
                }
              }
            }
            createdAt
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("GitHub API error:", response.status, response.statusText, errorText)
      return { repos: [], pageInfo: { hasNextPage: false, endCursor: null } }
    }

    const result: GraphQLResponse = await response.json()
    console.log("GitHub API response received, nodes count:", result.data?.search?.nodes?.length ?? 0)

    if (result.errors) {
      console.error("GitHub GraphQL errors:", result.errors)
      return { repos: [], pageInfo: { hasNextPage: false, endCursor: null } }
    }

    if (!result.data?.search?.nodes) {
      console.error("No search nodes in response:", JSON.stringify(result).substring(0, 200))
      return { repos: [], pageInfo: { hasNextPage: false, endCursor: null } }
    }

    // Filter out null entries and map to our format
    const repos: TrendingRepo[] = result.data.search.nodes
      .filter((repo): repo is GitHubRepo => repo !== null && repo.name !== undefined)
      .map((repo) => ({
        name: repo.name,
        fullName: repo.nameWithOwner,
        description: repo.description || "No description available",
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        url: repo.url,
        language: repo.primaryLanguage?.name || "Unknown",
        languageColor: repo.primaryLanguage?.color || "#6e7681",
        topics: repo.repositoryTopics.nodes.map((t) => t.topic.name),
        createdAt: repo.createdAt,
      }))

    return {
      repos,
      pageInfo: result.data.search.pageInfo,
    }
  } catch (error) {
    console.error("Error fetching trending repos:", error)
    return { repos: [], pageInfo: { hasNextPage: false, endCursor: null } }
  }
}

export default async function ReposPage() {
  // Fetch initial data - Next.js handles caching via revalidate
  const { repos, pageInfo } = await fetchTrendingRepos()

  return (
    <div className="min-h-screen">
      <Header />

      <main className="layout-container py-8">
        <TrendingRepos initialRepos={repos} initialPageInfo={pageInfo} />
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
