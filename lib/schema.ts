// lib/schema.ts
// Database schema definitions for the skills system
// Note: This project uses raw SQL with @neondatabase/serverless, not an ORM
// These type definitions document the table structure

/**
 * skills table - Master list of all supported skills for filtering
 *
 * CREATE TABLE skills (
 *   slug TEXT PRIMARY KEY,
 *   display_name TEXT NOT NULL,
 *   category TEXT NOT NULL,
 *   match_languages TEXT[] NOT NULL DEFAULT '{}',
 *   match_topics TEXT[] NOT NULL DEFAULT '{}',
 *   match_keywords TEXT[] NOT NULL DEFAULT '{}',
 *   created_at TIMESTAMP NOT NULL DEFAULT NOW()
 * );
 */
export interface Skill {
  slug: string
  displayName: string
  category: string
  matchLanguages: string[]
  matchTopics: string[]
  matchKeywords: string[]
  createdAt: Date
}

/**
 * user_skill_scores table - Computed scores linking users to skills
 *
 * CREATE TABLE user_skill_scores (
 *   username TEXT NOT NULL REFERENCES leaderboard(username) ON DELETE CASCADE,
 *   skill_slug TEXT NOT NULL REFERENCES skills(slug) ON DELETE CASCADE,
 *   score REAL NOT NULL DEFAULT 0,
 *   repo_count INTEGER NOT NULL DEFAULT 0,
 *   top_repos_json JSONB,
 *   computed_at TIMESTAMP NOT NULL DEFAULT NOW(),
 *   PRIMARY KEY (username, skill_slug)
 * );
 *
 * CREATE INDEX idx_uss_skill ON user_skill_scores(skill_slug);
 * CREATE INDEX idx_uss_score ON user_skill_scores(score);
 * CREATE INDEX idx_uss_username ON user_skill_scores(username);
 */
export interface UserSkillScore {
  username: string
  skillSlug: string
  score: number
  repoCount: number
  topReposJson: TopRepoEntry[] | null
  computedAt: Date
}

/**
 * Structure of entries in top_repos_json
 */
export interface TopRepoEntry {
  fullName: string
  ownerLogin: string
  name: string
  userPRs: number
  stars: number
  language: string | null
  topics: string[]
  score: number
}

/**
 * Skill categories for organization
 */
export type SkillCategory =
  | 'language'      // Programming languages (TypeScript, Python, Go, etc.)
  | 'framework'     // Frameworks (React, Next.js, Django, etc.)
  | 'platform'      // Platforms (AWS, Docker, Kubernetes, etc.)
  | 'domain'        // Domains (blockchain, ai, security, etc.)
  | 'tool'          // Tools (Git, CI/CD, etc.)

/**
 * Initial seed data for skills table
 * When adding a new skill, just add a row here and rerun the scoring
 */
export const SEED_SKILLS: Omit<Skill, 'createdAt'>[] = [
  // Languages
  {
    slug: 'typescript',
    displayName: 'TypeScript',
    category: 'language',
    matchLanguages: ['TypeScript'],
    matchTopics: ['typescript', 'ts'],
    matchKeywords: ['typescript', '.ts', '.tsx'],
  },
  {
    slug: 'javascript',
    displayName: 'JavaScript',
    category: 'language',
    matchLanguages: ['JavaScript'],
    matchTopics: ['javascript', 'js', 'nodejs', 'node'],
    matchKeywords: ['javascript', '.js', '.jsx'],
  },
  {
    slug: 'python',
    displayName: 'Python',
    category: 'language',
    matchLanguages: ['Python'],
    matchTopics: ['python', 'python3', 'py'],
    matchKeywords: ['python', '.py'],
  },
  {
    slug: 'go',
    displayName: 'Go',
    category: 'language',
    matchLanguages: ['Go'],
    matchTopics: ['golang', 'go'],
    matchKeywords: ['golang', '.go'],
  },
  {
    slug: 'rust',
    displayName: 'Rust',
    category: 'language',
    matchLanguages: ['Rust'],
    matchTopics: ['rust', 'rustlang'],
    matchKeywords: ['rust', '.rs'],
  },
  {
    slug: 'java',
    displayName: 'Java',
    category: 'language',
    matchLanguages: ['Java'],
    matchTopics: ['java', 'jvm'],
    matchKeywords: ['java', '.java'],
  },
  {
    slug: 'cpp',
    displayName: 'C++',
    category: 'language',
    matchLanguages: ['C++'],
    matchTopics: ['cpp', 'cplusplus'],
    matchKeywords: ['c++', '.cpp', '.hpp'],
  },
  {
    slug: 'c',
    displayName: 'C',
    category: 'language',
    matchLanguages: ['C'],
    matchTopics: ['c-programming', 'clang'],
    matchKeywords: ['.c', '.h'],
  },

  // Frameworks
  {
    slug: 'react',
    displayName: 'React',
    category: 'framework',
    matchLanguages: [],
    matchTopics: ['react', 'reactjs', 'react-native'],
    matchKeywords: ['react', 'jsx', 'tsx'],
  },
  {
    slug: 'nextjs',
    displayName: 'Next.js',
    category: 'framework',
    matchLanguages: [],
    matchTopics: ['nextjs', 'next-js', 'next'],
    matchKeywords: ['next.js', 'nextjs'],
  },
  {
    slug: 'vue',
    displayName: 'Vue',
    category: 'framework',
    matchLanguages: ['Vue'],
    matchTopics: ['vue', 'vuejs', 'vue3'],
    matchKeywords: ['vue', '.vue'],
  },
  {
    slug: 'django',
    displayName: 'Django',
    category: 'framework',
    matchLanguages: [],
    matchTopics: ['django', 'django-rest-framework'],
    matchKeywords: ['django'],
  },
  {
    slug: 'fastapi',
    displayName: 'FastAPI',
    category: 'framework',
    matchLanguages: [],
    matchTopics: ['fastapi'],
    matchKeywords: ['fastapi'],
  },

  // Platforms
  {
    slug: 'docker',
    displayName: 'Docker',
    category: 'platform',
    matchLanguages: ['Dockerfile'],
    matchTopics: ['docker', 'containers', 'containerization'],
    matchKeywords: ['docker', 'dockerfile', 'docker-compose'],
  },
  {
    slug: 'kubernetes',
    displayName: 'Kubernetes',
    category: 'platform',
    matchLanguages: [],
    matchTopics: ['kubernetes', 'k8s', 'helm'],
    matchKeywords: ['kubernetes', 'k8s', 'kubectl'],
  },
  {
    slug: 'aws',
    displayName: 'AWS',
    category: 'platform',
    matchLanguages: [],
    matchTopics: ['aws', 'amazon-web-services', 'lambda', 's3', 'ec2'],
    matchKeywords: ['aws', 'amazon', 'lambda', 'cloudformation'],
  },
  {
    slug: 'gcp',
    displayName: 'Google Cloud',
    category: 'platform',
    matchLanguages: [],
    matchTopics: ['gcp', 'google-cloud', 'firebase'],
    matchKeywords: ['gcp', 'google-cloud', 'firebase'],
  },
  {
    slug: 'azure',
    displayName: 'Azure',
    category: 'platform',
    matchLanguages: [],
    matchTopics: ['azure', 'microsoft-azure'],
    matchKeywords: ['azure'],
  },

  // Domains
  {
    slug: 'blockchain',
    displayName: 'Blockchain',
    category: 'domain',
    matchLanguages: ['Solidity'],
    matchTopics: ['blockchain', 'web3', 'ethereum', 'solidity', 'smart-contracts', 'defi', 'crypto'],
    matchKeywords: ['blockchain', 'web3', 'solidity', 'ethereum', 'smart-contract'],
  },
  {
    slug: 'ai',
    displayName: 'AI / ML',
    category: 'domain',
    matchLanguages: [],
    matchTopics: ['machine-learning', 'deep-learning', 'artificial-intelligence', 'ml', 'ai', 'neural-network', 'llm', 'gpt', 'transformer'],
    matchKeywords: ['machine-learning', 'deep-learning', 'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'llm'],
  },
  {
    slug: 'security',
    displayName: 'Security',
    category: 'domain',
    matchLanguages: [],
    matchTopics: ['security', 'cybersecurity', 'infosec', 'penetration-testing', 'cryptography'],
    matchKeywords: ['security', 'auth', 'encryption', 'vulnerability'],
  },
  {
    slug: 'devops',
    displayName: 'DevOps',
    category: 'domain',
    matchLanguages: [],
    matchTopics: ['devops', 'ci-cd', 'infrastructure-as-code', 'terraform', 'ansible'],
    matchKeywords: ['devops', 'ci/cd', 'terraform', 'ansible', 'jenkins'],
  },
  {
    slug: 'data-engineering',
    displayName: 'Data Engineering',
    category: 'domain',
    matchLanguages: [],
    matchTopics: ['data-engineering', 'etl', 'data-pipeline', 'apache-spark', 'airflow', 'kafka'],
    matchKeywords: ['data-engineering', 'etl', 'spark', 'airflow', 'kafka', 'data-pipeline'],
  },

  // Tools
  {
    slug: 'graphql',
    displayName: 'GraphQL',
    category: 'tool',
    matchLanguages: ['GraphQL'],
    matchTopics: ['graphql', 'apollo'],
    matchKeywords: ['graphql', 'apollo'],
  },
  {
    slug: 'postgresql',
    displayName: 'PostgreSQL',
    category: 'tool',
    matchLanguages: [],
    matchTopics: ['postgresql', 'postgres', 'sql'],
    matchKeywords: ['postgresql', 'postgres', 'psql'],
  },
  {
    slug: 'mongodb',
    displayName: 'MongoDB',
    category: 'tool',
    matchLanguages: [],
    matchTopics: ['mongodb', 'mongoose', 'nosql'],
    matchKeywords: ['mongodb', 'mongoose'],
  },
]
