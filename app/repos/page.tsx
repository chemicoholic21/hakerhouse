import { Header } from "@/components/header"
import { TrendingRepos } from "@/components/trending-repos"
import { buildPageMetadata } from "@/lib/seo"
import type { TrendingRepo } from "@/app/api/github/repos/route"

export const metadata = buildPageMetadata({
  title: "Repositories",
  description: "Discover trending open source repositories and projects.",
  path: "/repos",
})

// Revalidate every 5 minutes
export const revalidate = 300

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
    }
  }
  errors?: Array<{ message: string }>
}

async function fetchTrendingRepos(): Promise<TrendingRepo[]> {
  const token = process.env.GITHUB_TOKEN

  if (!token) {
    console.error("GITHUB_TOKEN is not set. Available env vars:", Object.keys(process.env).filter(k => k.includes('GITHUB') || k.includes('TOKEN')))
    return []
  }

  console.log("Fetching trending repos with token starting with:", token.substring(0, 10) + "...")

  // Get repos created in the last 30 days, sorted by stars
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const dateStr = thirtyDaysAgo.toISOString().split("T")[0]

  const query = `
    query {
      search(query: "created:>${dateStr} stars:>100", type: REPOSITORY, first: 50) {
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
      return []
    }

    const result: GraphQLResponse = await response.json()
    console.log("GitHub API response received, nodes count:", result.data?.search?.nodes?.length ?? 0)

    if (result.errors) {
      console.error("GitHub GraphQL errors:", result.errors)
      return []
    }

    if (!result.data?.search?.nodes) {
      console.error("No search nodes in response:", JSON.stringify(result).substring(0, 200))
      return []
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
      // Sort by stars descending
      .sort((a, b) => b.stars - a.stars)

    return repos
  } catch (error) {
    console.error("Error fetching trending repos:", error)
    return []
  }
}

export default async function ReposPage() {
  // Fetch directly without Redis cache - Next.js handles caching via revalidate
  const repos = await fetchTrendingRepos()

  return (
    <div className="min-h-screen">
      <Header />

      <main className="layout-container py-8">
        <TrendingRepos initialRepos={repos} />
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
