import { NextResponse } from "next/server"

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
  updatedAt: string
}

interface GraphQLResponse {
  data?: {
    search: {
      nodes: GitHubRepo[]
    }
  }
  errors?: Array<{ message: string }>
}

export interface TrendingRepo {
  name: string
  fullName: string
  description: string
  stars: number
  forks: number
  url: string
  language: string
  languageColor: string
  topics: string[]
  createdAt: string
}

async function fetchTrendingRepos(): Promise<TrendingRepo[]> {
  const token = process.env.GITHUB_TOKEN

  if (!token) {
    console.error("GITHUB_TOKEN is not set")
    return []
  }

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
            updatedAt
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
    })

    if (!response.ok) {
      console.error("GitHub API error:", response.status, response.statusText)
      return []
    }

    const result: GraphQLResponse = await response.json()

    if (result.errors) {
      console.error("GitHub GraphQL errors:", result.errors)
      return []
    }

    if (!result.data?.search?.nodes) {
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

export async function GET() {
  try {
    const repos = await fetchTrendingRepos()
    return NextResponse.json(repos)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Trending repos fetch error:", errorMessage)
    return NextResponse.json(
      { error: "Failed to fetch trending repos", details: errorMessage },
      { status: 500 }
    )
  }
}
