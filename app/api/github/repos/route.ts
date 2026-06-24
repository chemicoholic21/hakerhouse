import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { serverError } from '@/lib/api';

const sql = neon(process.env.DATABASE_URL!);

const SORT_COLUMNS = {
  contribution_score: 'rh.contribution_score',
  stars: 'rh.stars',
  responsiveness: 'rh.responsiveness_score',
  throughput: 'rh.throughput_score',
  acceptance: 'rh.acceptance_score',
  newcomer: 'rh.newcomer_score',
  liveness: 'rh.liveness_score',
  merge_velocity: 'rh.merge_velocity_per_month',
} as const;

// Validate and clamp query params. Invalid values fall back to safe defaults
// (via .catch) rather than being rejected, so the listing stays resilient.
const reposQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).catch(0),
  limit: z.coerce.number().int().min(1).max(100).catch(30),
  sort: z
    .enum(Object.keys(SORT_COLUMNS) as [keyof typeof SORT_COLUMNS])
    .catch('contribution_score'),
  language: z.string().max(100).nullish().catch(null),
  search: z.string().max(200).nullish().catch(null),
});

export interface TrendingRepo {
  name: string;
  fullName: string;
  owner: string;
  stars: number;
  forks: number | null;
  language: string | null;
  description: string | null;
  url: string;
  contributionScore: number;
  responsivenessScore: number | null;
  throughputScore: number | null;
  acceptanceScore: number | null;
  newcomerScore: number | null;
  livenessScore: number | null;
  confidence: number | null;
  mergedPrCount: number | null;
  medianMergeHours: number | null;
  acceptanceRate: number | null;
  openIssuesCount: number | null;
  goodFirstIssues: number | null;
  helpWantedIssues: number | null;
  hasContributing: boolean | null;
  hasCodeOfConduct: boolean | null;
  mentionableUsers: number | null;
  isArchived: boolean | null;
  pushedAt: string | null;
  lastReleaseAt: string | null;
  mergeVelocityPerMonth: number | null;
  gatedReason: string | null;
}

export interface ReposResponse {
  repos: TrendingRepo[];
  hasMore: boolean;
  total: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { offset, limit, sort, language, search } = reposQuerySchema.parse({
      offset: searchParams.get('offset') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      language: searchParams.get('language'),
      search: searchParams.get('search'),
    });

    const orderBy = SORT_COLUMNS[sort];

    const conditions: string[] = ['rh.gated_reason IS NULL'];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (language && language !== 'all') {
      conditions.push(`rh.primary_language = $${paramIdx}`);
      params.push(language);
      paramIdx++;
    }

    if (search) {
      conditions.push(`rh.full_name ILIKE $${paramIdx}`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await sql.query(
      `SELECT count(*) FROM repo_health rh ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].count, 10);

    params.push(limit);
    params.push(offset);

    const rows = await sql.query(
      `SELECT
        rh.full_name,
        rh.owner_login,
        rh.repo_name,
        rh.primary_language,
        rh.stars,
        gr.forks,
        gr.description,
        rh.is_archived,
        rh.pushed_at,
        rh.last_release_at,
        rh.merged_pr_count,
        rh.median_merge_hours,
        rh.acceptance_rate,
        rh.merge_velocity_per_month,
        rh.open_issues_count,
        rh.good_first_issues,
        rh.help_wanted_issues,
        rh.has_contributing,
        rh.has_code_of_conduct,
        rh.mentionable_users,
        rh.contribution_score,
        rh.responsiveness_score,
        rh.throughput_score,
        rh.acceptance_score,
        rh.newcomer_score,
        rh.liveness_score,
        rh.confidence,
        rh.gated_reason
      FROM repo_health rh
      LEFT JOIN github_repos gr ON gr.full_name = rh.full_name
      ${whereClause}
      ORDER BY ${orderBy} DESC NULLS LAST
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repos: TrendingRepo[] = rows.map((row: any) => ({
      name: row.repo_name,
      fullName: row.full_name,
      owner: row.owner_login,
      stars: row.stars,
      forks: row.forks,
      language: row.primary_language,
      description: row.description,
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
    }));

    const hasMore = offset + limit < total;

    return NextResponse.json({ repos, hasMore, total });
  } catch (error: unknown) {
    return serverError('fetch trending repos', error);
  }
}
