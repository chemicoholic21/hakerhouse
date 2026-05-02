# hackerhou.se

A home for human programmers. Discover open-source projects, meet developers, find roles, and explore global developer talent.

## What is this?

hackerhou.se is a platform that connects developers through their open-source contributions. Instead of relying on resumes or self-reported skills, it analyzes actual GitHub activity to build developer profiles and match them with opportunities.

The platform pulls data from GitHub, scores contributions across different skill categories, and presents a leaderboard of active developers. You can filter by programming language, framework, location, or domain expertise to find collaborators or talent.

## Tech Stack

**Frontend**
- Next.js 16.2 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI + shadcn/ui components
- Motion for animations
- Recharts for data viz

**Backend**
- Next.js API routes
- Neon PostgreSQL (serverless)
- GitHub GraphQL API via Octokit
- NextAuth for GitHub OAuth

**Hosting**
- Built for Vercel deployment

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- PostgreSQL database (Neon recommended)
- GitHub OAuth app credentials

### Environment Variables

Create a `.env.local` file:

```bash
# Database
DATABASE_URL="postgresql://..."

# GitHub OAuth (create at github.com/settings/developers)
GITHUB_ID="your_oauth_app_id"
GITHUB_SECRET="your_oauth_app_secret"

# GitHub API token for fetching repos
GITHUB_TOKEN="ghp_..."

# NextAuth
NEXTAUTH_SECRET="generate_a_random_string"
NEXTAUTH_URL="http://localhost:3000"
```

### Installation

```bash
# Install dependencies
npm install

# Run database migrations
# (apply the SQL files in /migrations manually for now)

# Seed skills data
npm run db:compute-skills

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  api/
    auth/[...nextauth]/   # Auth endpoints
    github/
      readme/             # Update GitHub profile README
      repos/              # Trending repos endpoint
    insights/
      map/                # Geographic distribution data
      stats/              # Analytics data
  devs/                   # Developer directory
  repos/                  # Trending repositories
  roles/                  # Job listings
  insights/               # Analytics dashboard
  [username]/             # Individual dev profiles

components/
  ui/                     # shadcn components
  insights/               # Charts and visualizations
  header.tsx
  hero.tsx
  devs-list.tsx
  trending-repos.tsx
  weekly-leaderboard.tsx
  ...

lib/
  db.ts                   # Database connection
  schema.ts               # Table schemas + skill taxonomy
  query-builder.ts        # Type-safe SQL builder
  rate-limit.ts           # In-memory rate limiting
  seo.ts                  # Metadata helpers
  utils.ts                # cn() and other utils

scripts/
  compute-skill-scores.ts # Calculate skill rankings
```

## Database Schema

The main tables:

**leaderboard** - Core developer data
- username, name, location
- total_score, unique_skills_json, languages_json
- timestamps

**analyses** - Computed analysis results
- languages_json (programming languages used)
- contribution_count
- top_repos_json (user's notable repositories)

**skills** - Skill taxonomy (170+ entries)
- slug, display_name, category
- match_languages, match_topics, match_keywords
- Categories: language, framework, platform, domain, tool

**user_skill_scores** - Computed scores linking users to skills
- username, skill_slug, score, repo_count
- top_repos_json (repos matching this skill)

## Skills System

The platform recognizes 170+ skills across 5 categories:

- **Languages** - TypeScript, Python, Rust, Go, etc.
- **Frameworks** - React, Next.js, Django, FastAPI, etc.
- **Platforms** - AWS, Docker, Kubernetes, Vercel, etc.
- **Domains** - AI/ML, blockchain, security, DevOps, etc.
- **Tools** - PostgreSQL, GraphQL, GitHub Actions, etc.

Each skill has matching rules based on:
- Primary language of repositories
- Topics tagged on repos
- Keywords in repo names/descriptions

Run `npm run db:compute-skills` to recompute all user skill scores.

## Features

### Developer Discovery
Browse and filter developers by:
- Skills and expertise
- Programming languages
- Location/country
- Impact score

### Repository Discovery
View trending repositories from GitHub with:
- Star counts and fork info
- Language and topic tags
- Infinite scroll pagination

### Analytics Dashboard
See aggregate data about the developer community:
- Geographic distribution map
- Skills distribution charts
- Impact score trends
- Regional rankings

### Profile README Generation
Authenticated users can generate a badge/summary to add to their GitHub profile README.

## API Endpoints

**Public**
- `GET /api/github/repos` - Trending repos (paginated)
- `GET /api/insights/map` - Geographic data
- `GET /api/insights/stats` - Community stats

**Authenticated**
- `POST /api/github/readme` - Update profile README

Rate limits:
- API: 30 requests per 10 seconds
- Write operations: 5 requests per 60 seconds

## Theming

7 built-in themes:
- Auto (system preference)
- Light
- Dark
- Monokai
- Dracula
- Solarized
- Nord

Toggle via the theme switcher in the header.

## Security Notes

- SQL injection protection via parameterized queries and allowlisted columns
- GitHub OAuth for authentication (no passwords stored)
- Rate limiting to prevent abuse
- Security headers (X-Frame-Options, X-Content-Type-Options)

## Scripts

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run db:compute-skills # Recalculate skill scores
```

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` to check for issues
5. Submit a PR

## Architecture Decisions

**Why no ORM?**
Raw SQL with a type-safe query builder gives more control and avoids ORM overhead. The query builder validates inputs and prevents injection.

**Why in-memory rate limiting?**
Simpler deployment without Redis. Works fine for single-server setups. For multi-server, swap to Redis.

**Why Neon?**
Serverless PostgreSQL that scales to zero. Good fit for Next.js on Vercel.

**Why GitHub data only?**
GitHub has the best API and most open-source activity. GitLab/Bitbucket support could be added later.

## License

MIT

---

Built for developers who ship code, not slide decks.
