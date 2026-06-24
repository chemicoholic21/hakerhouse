/** Shared demo copy for user profiles (identity comes from Developer + URL) */

export type ContributionKind = 'commit' | 'pr' | 'issue' | 'review';

export interface PrototypeContribution {
  kind: ContributionKind;
  repo: string;
  title: string;
  time: string;
}

/**
 * A contribution row as rendered on a real profile. Built from live data
 * (top_repos_json / user_repo_scores), so `kind` is a loose string and an
 * optional `score` (impact) may be present.
 */
export interface ProfileContribution {
  kind: string;
  repo: string;
  title: string;
  time: string;
  score?: number;
}

export const prototypeContributions: readonly PrototypeContribution[] = [
  {
    kind: 'pr',
    repo: 'jarrodwatts/claude-hud',
    title: 'feat: surface active tool calls in status strip',
    time: '2 days ago',
  },
  {
    kind: 'commit',
    repo: 'jarrodwatts/claude-hud',
    title: 'chore: bump telemetry schema',
    time: '3 days ago',
  },
  {
    kind: 'issue',
    repo: 'protocolbuffers/protobuf',
    title: 'Document field presence edge cases',
    time: '5 days ago',
  },
  {
    kind: 'pr',
    repo: 'Crosstalk-Solutions/project-nomad',
    title: 'docs: offline update checklist',
    time: '1 week ago',
  },
  {
    kind: 'review',
    repo: 'vllm-project/vllm-omni',
    title: 'Reviewed multimodal batching proposal',
    time: '1 week ago',
  },
  {
    kind: 'commit',
    repo: 'aquasecurity/trivy',
    title: 'fix: skip empty layer digests in cache key',
    time: '2 weeks ago',
  },
];

export const prototypeProfile = {
  bio: 'Building developer tools, Claude plugins, and things that help humans ship.',
  weeklyRank: 2,
  weeklyScore: 15_241.2,
  skillsStrong: ['JavaScript', 'React', 'TypeScript'] as const,
  skillsAlso: ['Python', 'Docker'] as const,
} as const;
