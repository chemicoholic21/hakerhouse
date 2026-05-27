# hackerhou.se

A platform that connects developers by analyzing actual GitHub activity to build profiles and match talent with open-source opportunities.

## Setup

**Prerequisites:** Node.js 20+, npm/pnpm, PostgreSQL, and GitHub OAuth app credentials.

**1. Environment Variables** Create a `.env.local` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://..."

# GitHub OAuth (create at [github.com/settings/developers](https://github.com/settings/developers))
GITHUB_ID="your_oauth_app_id"
GITHUB_SECRET="your_oauth_app_secret"

# GitHub API token for fetching repos
GITHUB_TOKEN="ghp_..."

# NextAuth
NEXTAUTH_SECRET="generate_a_random_string"
NEXTAUTH_URL="http://localhost:3000"
```

**2. Installation & Running**
```bash
# Install dependencies
npm install

# Apply database migrations manually from /migrations

# Seed skills data
npm run db:compute-skills

# Start dev server
npm run dev
```
Open `http://localhost:3000` to view the app.

## Scripts

* `npm run dev` - Start development server
* `npm run build` - Create production build
* `npm run start` - Start production server
* `npm run lint` - Run ESLint checks
* `npm run db:compute-skills` - Recalculate and update user skill scores in the database

## Core Structure

* `app/` - Next.js App Router containing pages, API routes, and developer profiles.
* `components/` - React components, including shadcn/ui and visualizations.
* `lib/` - Core logic, including database schema, raw SQL query builder, and utilities.
* `scripts/` - Standalone backend scripts for data processing.
