-- Migration: Add skills and user_skill_scores tables
-- Description: Adds support for skill-based filtering and ranking of developers
-- Date: 2026-04-30

-- Create skills table - master list of all supported skills
CREATE TABLE IF NOT EXISTS skills (
  slug TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  match_languages TEXT[] NOT NULL DEFAULT '{}',
  match_topics TEXT[] NOT NULL DEFAULT '{}',
  match_keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create user_skill_scores table - computed scores linking users to skills
CREATE TABLE IF NOT EXISTS user_skill_scores (
  username TEXT NOT NULL REFERENCES leaderboard(username) ON DELETE CASCADE,
  skill_slug TEXT NOT NULL REFERENCES skills(slug) ON DELETE CASCADE,
  score REAL NOT NULL DEFAULT 0,
  repo_count INTEGER NOT NULL DEFAULT 0,
  top_repos_json JSONB,
  computed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (username, skill_slug)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_uss_skill ON user_skill_scores(skill_slug);
CREATE INDEX IF NOT EXISTS idx_uss_score ON user_skill_scores(score);
CREATE INDEX IF NOT EXISTS idx_uss_username ON user_skill_scores(username);

-- Composite index for skill filtering with score ordering (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_uss_skill_score ON user_skill_scores(skill_slug, score DESC);

-- Index on skills category for filtering by skill type
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

-- Seed initial skills data
INSERT INTO skills (slug, display_name, category, match_languages, match_topics, match_keywords) VALUES
  -- Languages
  ('typescript', 'TypeScript', 'language', ARRAY['TypeScript'], ARRAY['typescript', 'ts'], ARRAY['typescript', '.ts', '.tsx']),
  ('javascript', 'JavaScript', 'language', ARRAY['JavaScript'], ARRAY['javascript', 'js', 'nodejs', 'node'], ARRAY['javascript', '.js', '.jsx']),
  ('python', 'Python', 'language', ARRAY['Python'], ARRAY['python', 'python3', 'py'], ARRAY['python', '.py']),
  ('go', 'Go', 'language', ARRAY['Go'], ARRAY['golang', 'go'], ARRAY['golang', '.go']),
  ('rust', 'Rust', 'language', ARRAY['Rust'], ARRAY['rust', 'rustlang'], ARRAY['rust', '.rs']),
  ('java', 'Java', 'language', ARRAY['Java'], ARRAY['java', 'jvm'], ARRAY['java', '.java']),
  ('cpp', 'C++', 'language', ARRAY['C++'], ARRAY['cpp', 'cplusplus'], ARRAY['c++', '.cpp', '.hpp']),
  ('c', 'C', 'language', ARRAY['C'], ARRAY['c-programming', 'clang'], ARRAY['.c', '.h']),

  -- Frameworks
  ('react', 'React', 'framework', ARRAY[]::TEXT[], ARRAY['react', 'reactjs', 'react-native'], ARRAY['react', 'jsx', 'tsx']),
  ('nextjs', 'Next.js', 'framework', ARRAY[]::TEXT[], ARRAY['nextjs', 'next-js', 'next'], ARRAY['next.js', 'nextjs']),
  ('vue', 'Vue', 'framework', ARRAY['Vue'], ARRAY['vue', 'vuejs', 'vue3'], ARRAY['vue', '.vue']),
  ('django', 'Django', 'framework', ARRAY[]::TEXT[], ARRAY['django', 'django-rest-framework'], ARRAY['django']),
  ('fastapi', 'FastAPI', 'framework', ARRAY[]::TEXT[], ARRAY['fastapi'], ARRAY['fastapi']),

  -- Platforms
  ('docker', 'Docker', 'platform', ARRAY['Dockerfile'], ARRAY['docker', 'containers', 'containerization'], ARRAY['docker', 'dockerfile', 'docker-compose']),
  ('kubernetes', 'Kubernetes', 'platform', ARRAY[]::TEXT[], ARRAY['kubernetes', 'k8s', 'helm'], ARRAY['kubernetes', 'k8s', 'kubectl']),
  ('aws', 'AWS', 'platform', ARRAY[]::TEXT[], ARRAY['aws', 'amazon-web-services', 'lambda', 's3', 'ec2'], ARRAY['aws', 'amazon', 'lambda', 'cloudformation']),
  ('gcp', 'Google Cloud', 'platform', ARRAY[]::TEXT[], ARRAY['gcp', 'google-cloud', 'firebase'], ARRAY['gcp', 'google-cloud', 'firebase']),
  ('azure', 'Azure', 'platform', ARRAY[]::TEXT[], ARRAY['azure', 'microsoft-azure'], ARRAY['azure']),

  -- Domains
  ('blockchain', 'Blockchain', 'domain', ARRAY['Solidity'], ARRAY['blockchain', 'web3', 'ethereum', 'solidity', 'smart-contracts', 'defi', 'crypto'], ARRAY['blockchain', 'web3', 'solidity', 'ethereum', 'smart-contract']),
  ('ai', 'AI / ML', 'domain', ARRAY[]::TEXT[], ARRAY['machine-learning', 'deep-learning', 'artificial-intelligence', 'ml', 'ai', 'neural-network', 'llm', 'gpt', 'transformer'], ARRAY['machine-learning', 'deep-learning', 'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'llm']),
  ('security', 'Security', 'domain', ARRAY[]::TEXT[], ARRAY['security', 'cybersecurity', 'infosec', 'penetration-testing', 'cryptography'], ARRAY['security', 'auth', 'encryption', 'vulnerability']),
  ('devops', 'DevOps', 'domain', ARRAY[]::TEXT[], ARRAY['devops', 'ci-cd', 'infrastructure-as-code', 'terraform', 'ansible'], ARRAY['devops', 'ci/cd', 'terraform', 'ansible', 'jenkins']),
  ('data-engineering', 'Data Engineering', 'domain', ARRAY[]::TEXT[], ARRAY['data-engineering', 'etl', 'data-pipeline', 'apache-spark', 'airflow', 'kafka'], ARRAY['data-engineering', 'etl', 'spark', 'airflow', 'kafka', 'data-pipeline']),

  -- Tools
  ('graphql', 'GraphQL', 'tool', ARRAY['GraphQL'], ARRAY['graphql', 'apollo'], ARRAY['graphql', 'apollo']),
  ('postgresql', 'PostgreSQL', 'tool', ARRAY[]::TEXT[], ARRAY['postgresql', 'postgres', 'sql'], ARRAY['postgresql', 'postgres', 'psql']),
  ('mongodb', 'MongoDB', 'tool', ARRAY[]::TEXT[], ARRAY['mongodb', 'mongoose', 'nosql'], ARRAY['mongodb', 'mongoose'])
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  match_languages = EXCLUDED.match_languages,
  match_topics = EXCLUDED.match_topics,
  match_keywords = EXCLUDED.match_keywords;
