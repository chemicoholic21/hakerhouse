"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Star, GitFork, ChevronDown, ExternalLink, Loader2 } from "lucide-react"
import type { TrendingRepo, ReposResponse } from "@/app/api/github/repos/route"

function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedLabel = options.find((o) => o.value === value)?.label || label

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="border-2 border-foreground px-3 py-1 text-sm flex items-center gap-2 hover:bg-foreground hover:text-background"
      >
        <span>
          {label}: {selectedLabel}
        </span>
        <ChevronDown
          className={`w-3 h-3 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 border-2 border-foreground bg-background z-50 min-w-full max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-foreground hover:text-background ${
                value === option.value ? "bg-foreground/10" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function formatStars(stars: number): string {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1)}k`
  }
  return stars.toLocaleString()
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "today"
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

interface TrendingReposProps {
  initialRepos: TrendingRepo[]
  initialPageInfo?: {
    hasNextPage: boolean
    endCursor: string | null
  }
}

export function TrendingRepos({ initialRepos, initialPageInfo }: TrendingReposProps) {
  const [repos, setRepos] = useState<TrendingRepo[]>(initialRepos)
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPageInfo?.hasNextPage ?? true)
  const [cursor, setCursor] = useState<string | null>(initialPageInfo?.endCursor ?? null)
  const [error, setError] = useState<string | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Build language options from all loaded repos
  const languageOptions = [
    { value: "all", label: "All" },
    ...Array.from(new Set(repos.map((r) => r.language)))
      .filter((lang) => lang !== "Unknown")
      .sort()
      .map((lang) => ({ value: lang, label: lang })),
  ]

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    setError(null)

    try {
      const url = cursor
        ? `/api/github/repos?cursor=${encodeURIComponent(cursor)}`
        : "/api/github/repos"

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Failed to fetch repositories")
      }

      const data: ReposResponse = await response.json()

      if (data.repos && data.repos.length > 0) {
        setRepos((prev) => {
          // Deduplicate by fullName
          const existing = new Set(prev.map((r) => r.fullName))
          const newRepos = data.repos.filter((r) => !existing.has(r.fullName))
          return [...prev, ...newRepos]
        })
      }

      setHasMore(data.pageInfo?.hasNextPage ?? false)
      setCursor(data.pageInfo?.endCursor ?? null)
    } catch (err) {
      console.error("Error loading more repos:", err)
      setError("Failed to load more repositories")
    } finally {
      setIsLoading(false)
    }
  }, [cursor, hasMore, isLoading])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMore, isLoading, loadMore])

  const filteredRepos = repos.filter((repo) => {
    return selectedLanguage === "all" || repo.language === selectedLanguage
  })

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-highlight">
          Trending Repositories
        </h2>
        <span className="text-sm text-muted-foreground">
          New repos from the last 30 days · {repos.length} loaded
        </span>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Dropdown
          label="Language"
          value={selectedLanguage}
          options={languageOptions}
          onChange={(v) => setSelectedLanguage(v)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRepos.map((repo) => (
          <a
            key={repo.fullName}
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-foreground p-4 cursor-pointer flex flex-col group hover:bg-foreground/[0.03]"
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: repo.languageColor }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm break-all group-hover:underline text-highlight flex items-center gap-1">
                  {repo.fullName}
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {repo.language} · Created {getTimeAgo(repo.createdAt)}
                </span>
              </div>
            </div>

            <p className="text-sm mb-3 line-clamp-2 flex-1">
              {repo.description}
            </p>

            {repo.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {repo.topics.slice(0, 4).map((topic) => (
                  <span
                    key={topic}
                    className="border border-foreground px-1.5 py-0.5 text-xs"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 text-sm mt-auto text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5" />
                {formatStars(repo.stars)}
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="w-3.5 h-3.5" />
                {repo.forks.toLocaleString()}
              </span>
            </div>
          </a>
        ))}
      </div>

      {filteredRepos.length === 0 && !isLoading && (
        <div className="border-2 border-dashed border-foreground/50 p-8 text-center">
          <p>No repositories match the selected filters.</p>
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="py-8 flex justify-center">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading more repositories...</span>
          </div>
        )}
        {error && (
          <div className="text-red-500">
            {error}
            <button
              onClick={loadMore}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}
        {!hasMore && repos.length > 0 && !isLoading && (
          <span className="text-muted-foreground text-sm">
            No more repositories to load
          </span>
        )}
      </div>
    </section>
  )
}
