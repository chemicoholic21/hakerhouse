import { Zap, MessageSquare, FolderSync, Brain, Cloud, Database, LucideIcon } from 'lucide-react';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type Category = 'all' | 'api' | 'security' | 'tools' | 'ml' | 'devops' | 'database';

export interface Repo {
  name: string;
  description: string;
  tags: string[];
  stars: string | number;
  forks: number;
  icon: LucideIcon;
  category: Category;
  difficulty: Difficulty;
  language: string;
}

export interface Developer {
  /** Display name (e.g. for directory / profile headers) */
  name: string;
  username: string;
  skills: string[];
  repos: number;
  followers: number;
  language: string;
  country: string;
}

export type RoleWorkplace = 'remote' | 'onsite' | 'hybrid';
export type RoleArea =
  | 'engineering'
  | 'product'
  | 'design'
  | 'sales'
  | 'gtm'
  | 'security'
  | 'data'
  | 'ml'
  | 'customer_success'
  | 'intern';

export const roleTechnicalSkillFilters = [
  'Python',
  'TypeScript',
  'Go',
  'Rust',
  'React',
  'ML / AI',
  'Security',
  'Data engineering',
  'Infrastructure',
  'Open source',
] as const;

export type RoleTechnicalSkill = (typeof roleTechnicalSkillFilters)[number];

export interface Role {
  title: string;
  company: string;
  location: string;
  workplace: RoleWorkplace;
  area: RoleArea;
  /** Subset of roleTechnicalSkillFilters; used on /roles for skill chips filter */
  skills: RoleTechnicalSkill[];
  tags: string[];
}

const TECHNICAL_ROLE_AREAS: readonly RoleArea[] = [
  'engineering',
  'security',
  'data',
  'ml',
  'intern',
];

export function isTechnicalRole(role: Role): boolean {
  return TECHNICAL_ROLE_AREAS.includes(role.area);
}

export const roleWorkplaceOptions: { value: RoleWorkplace | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'remote', label: 'Remote' },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const roleAreaOptions: { value: RoleArea | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'product', label: 'Product' },
  { value: 'design', label: 'Design' },
  { value: 'sales', label: 'Sales' },
  { value: 'gtm', label: 'GTM' },
  { value: 'security', label: 'Security' },
  { value: 'data', label: 'Data' },
  { value: 'ml', label: 'ML / AI' },
  { value: 'customer_success', label: 'Customer success' },
  { value: 'intern', label: 'Internship' },
];

export const repos: Repo[] = [
  {
    name: 'FujiwaraChoki/MoneyPrinterV2',
    description: 'Automate the process of making money online.',
    tags: ['Python', '379 stars today'],
    stars: 17856,
    forks: 1902,
    icon: Zap,
    category: 'tools',
    difficulty: 'intermediate',
    language: 'Python',
  },
  {
    name: 'systemd/systemd',
    description: 'The systemd System and Service Manager',
    tags: ['C', '112 stars today'],
    stars: 15737,
    forks: 4354,
    icon: Cloud,
    category: 'devops',
    difficulty: 'advanced',
    language: 'C',
  },
  {
    name: 'aquasecurity/trivy',
    description:
      'Find vulnerabilities, misconfigurations, secrets, SBOM in containers, Kubernetes, code repositories, clouds and more',
    tags: ['Go', '127 stars today'],
    stars: 33388,
    forks: 125,
    icon: MessageSquare,
    category: 'security',
    difficulty: 'advanced',
    language: 'Go',
  },
  {
    name: 'Crosstalk-Solutions/project-nomad',
    description:
      'Project N.O.M.A.D, is a self-contained, offline survival computer packed with critical tools, knowledge, and AI to keep you informed and empowered—anytime, anywhere.',
    tags: ['TypeScript', '2,054 stars today'],
    stars: 6870,
    forks: 646,
    icon: FolderSync,
    category: 'tools',
    difficulty: 'advanced',
    language: 'TypeScript',
  },
  {
    name: 'opendataloader-project/opendataloader-pdf',
    description: 'PDF Parser for AI-ready data. Automate PDF accessibility. Open-source.',
    tags: ['Java', '954 stars today'],
    stars: 7917,
    forks: 535,
    icon: Database,
    category: 'tools',
    difficulty: 'intermediate',
    language: 'Java',
  },
  {
    name: 'jarrodwatts/claude-hud',
    description:
      "A Claude Code plugin that shows what's happening - context usage, active tools, running agents, and todo progress",
    tags: ['JavaScript', '957 stars today'],
    stars: 10486,
    forks: 448,
    icon: Brain,
    category: 'tools',
    difficulty: 'intermediate',
    language: 'JavaScript',
  },
  {
    name: 'protocolbuffers/protobuf',
    description: "Protocol Buffers - Google's data interchange format",
    tags: ['C++', '7 stars today'],
    stars: 70950,
    forks: 16083,
    icon: Zap,
    category: 'api',
    difficulty: 'advanced',
    language: 'C++',
  },
  {
    name: 'vllm-project/vllm-omni',
    description: 'A framework for efficient model inference with omni-modality models',
    tags: ['Python', '82 stars today'],
    stars: 3521,
    forks: 587,
    icon: Brain,
    category: 'ml',
    difficulty: 'advanced',
    language: 'Python',
  },
  {
    name: 'louis-e/arnis',
    description:
      'Generate any location from the real world in Minecraft with a high level of detail.',
    tags: ['Rust', '680 stars today'],
    stars: 12248,
    forks: 1014,
    icon: FolderSync,
    category: 'tools',
    difficulty: 'intermediate',
    language: 'Rust',
  },
];

export const developers: Developer[] = [
  {
    name: 'Nick Brake',
    username: 'njbrake',
    skills: ['TypeScript', 'React', 'Python'],
    repos: 62,
    followers: 9100,
    language: 'TypeScript',
    country: 'USA',
  },
  {
    name: 'Azure SDK',
    username: 'azure-sdk',
    skills: ['Python', 'Go', 'Docker'],
    repos: 188,
    followers: 8200,
    language: 'Python',
    country: 'USA',
  },
  {
    name: 'Yi Chen',
    username: '1c7',
    skills: ['React', 'TypeScript', 'Rust'],
    repos: 94,
    followers: 7800,
    language: 'TypeScript',
    country: 'Japan',
  },
  {
    name: 'Peter Stevens',
    username: 'peters',
    skills: ['Go', 'Kubernetes', 'AWS'],
    repos: 51,
    followers: 6500,
    language: 'Go',
    country: 'UK',
  },
  {
    name: 'Brady Gaster',
    username: 'bradygaster',
    skills: ['TypeScript', 'React', 'Docker'],
    repos: 73,
    followers: 5900,
    language: 'TypeScript',
    country: 'USA',
  },
  {
    name: 'Jarrod Watts',
    username: 'jarrodwatts',
    skills: ['JavaScript', 'React', 'Python'],
    repos: 88,
    followers: 11200,
    language: 'JavaScript',
    country: 'Australia',
  },
  {
    name: 'Cole Murray',
    username: 'ColeMurray',
    skills: ['Python', 'Rust', 'Kubernetes'],
    repos: 45,
    followers: 4800,
    language: 'Python',
    country: 'USA',
  },
  {
    name: 'David East',
    username: 'davideast',
    skills: ['TypeScript', 'Go', 'AWS'],
    repos: 56,
    followers: 9200,
    language: 'TypeScript',
    country: 'USA',
  },
  {
    name: 'Hartmut Kaiser',
    username: 'hkaiser',
    skills: ['Rust', 'Go', 'Docker'],
    repos: 412,
    followers: 3400,
    language: 'Rust',
    country: 'Germany',
  },
  {
    name: 'Lukas Masuch',
    username: 'lukasmasuch',
    skills: ['Python', 'Kubernetes', 'AWS'],
    repos: 67,
    followers: 5100,
    language: 'Python',
    country: 'Germany',
  },
  {
    name: 'Per Homan',
    username: 'homanp',
    skills: ['Python', 'Docker', 'Go'],
    repos: 39,
    followers: 4200,
    language: 'Python',
    country: 'Sweden',
  },
  {
    name: 'Elie Steinbock',
    username: 'elie222',
    skills: ['TypeScript', 'React', 'Python'],
    repos: 58,
    followers: 6700,
    language: 'TypeScript',
    country: 'Israel',
  },
  {
    name: 'Chris König',
    username: 'ko3n1g',
    skills: ['Python', 'Kubernetes', 'AWS'],
    repos: 44,
    followers: 8900,
    language: 'Python',
    country: 'USA',
  },
  {
    name: 'Jonny Burger',
    username: 'JonnyBurger',
    skills: ['TypeScript', 'React', 'Docker'],
    repos: 91,
    followers: 13400,
    language: 'TypeScript',
    country: 'Switzerland',
  },
  {
    name: 'Ömer Aplak',
    username: 'omeraplak',
    skills: ['TypeScript', 'React', 'Go'],
    repos: 52,
    followers: 6100,
    language: 'TypeScript',
    country: 'Turkey',
  },
  {
    name: 'Jamie Pine',
    username: 'jamiepine',
    skills: ['JavaScript', 'React', 'Python'],
    repos: 48,
    followers: 7200,
    language: 'JavaScript',
    country: 'UK',
  },
  {
    name: 'Richard Thompson',
    username: 'RichardAtCT',
    skills: ['Python', 'Docker', 'Kubernetes'],
    repos: 36,
    followers: 3900,
    language: 'Python',
    country: 'USA',
  },
  {
    name: 'Theo Vilardo',
    username: 'theovilardo',
    skills: ['Rust', 'Go', 'AWS'],
    repos: 29,
    followers: 2800,
    language: 'Rust',
    country: 'Italy',
  },
  {
    name: 'Hunter Li',
    username: 'dreamhunter2333',
    skills: ['Go', 'Kubernetes', 'Docker'],
    repos: 71,
    followers: 5500,
    language: 'Go',
    country: 'China',
  },
  {
    name: 'Mitchell Hashimoto',
    username: 'mitchellh',
    skills: ['Go', 'Rust', 'Kubernetes'],
    repos: 156,
    followers: 22100,
    language: 'Go',
    country: 'USA',
  },
  {
    name: 'Niels Laute',
    username: 'niels9001',
    skills: ['TypeScript', 'React', 'AWS'],
    repos: 63,
    followers: 4400,
    language: 'TypeScript',
    country: 'Netherlands',
  },
  {
    name: 'Ruben Verborgh',
    username: 'ruvnet',
    skills: ['Python', 'Rust', 'Docker'],
    repos: 77,
    followers: 5100,
    language: 'Python',
    country: 'USA',
  },
  {
    name: 'Rolf Bjarne Kvinge',
    username: 'rolfbjarne',
    skills: ['TypeScript', 'Go', 'Kubernetes'],
    repos: 203,
    followers: 9800,
    language: 'TypeScript',
    country: 'Norway',
  },
  {
    name: 'Jack Wener',
    username: 'jackwener',
    skills: ['Rust', 'Go', 'AWS'],
    repos: 54,
    followers: 4600,
    language: 'Rust',
    country: 'China',
  },
  {
    name: 'Sero Park',
    username: '0xSero',
    skills: ['Python', 'Kubernetes', 'Docker'],
    repos: 33,
    followers: 3100,
    language: 'Python',
    country: 'USA',
  },
];

export const languages = [
  { value: 'all', label: 'All' },
  { value: 'C', label: 'C' },
  { value: 'C++', label: 'C++' },
  { value: 'Go', label: 'Go' },
  { value: 'Java', label: 'Java' },
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'Python', label: 'Python' },
  { value: 'Rust', label: 'Rust' },
  { value: 'TypeScript', label: 'TypeScript' },
];

export const countries = [
  { value: 'all', label: 'All' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Brazil', label: 'Brazil' },
  { value: 'Canada', label: 'Canada' },
  { value: 'China', label: 'China' },
  { value: 'France', label: 'France' },
  { value: 'Germany', label: 'Germany' },
  { value: 'India', label: 'India' },
  { value: 'Israel', label: 'Israel' },
  { value: 'Italy', label: 'Italy' },
  { value: 'Japan', label: 'Japan' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Norway', label: 'Norway' },
  { value: 'Sweden', label: 'Sweden' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Turkey', label: 'Turkey' },
  { value: 'UK', label: 'UK' },
  { value: 'USA', label: 'USA' },
];

export const skillsList = [
  { value: 'all', label: 'All' },
  { value: 'React', label: 'React' },
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'Python', label: 'Python' },
  { value: 'Rust', label: 'Rust' },
  { value: 'Go', label: 'Go' },
  { value: 'Docker', label: 'Docker' },
  { value: 'Kubernetes', label: 'Kubernetes' },
  { value: 'AWS', label: 'AWS' },
];

export const roles: Role[] = [
  {
    title: 'Symbolic RL search guidance lead',
    company: 'Ndea',
    location: 'Remote',
    workplace: 'remote',
    area: 'ml',
    skills: ['ML / AI', 'Python'],
    tags: ['Reinforcement learning', 'Research', 'Staff'],
  },
  {
    title: 'Product specialist',
    company: 'Spice Data',
    location: 'Remote',
    workplace: 'remote',
    area: 'product',
    skills: [],
    tags: ['B2B', 'Data tooling', 'Customer-facing'],
  },
  {
    title: 'Software engineer',
    company: 'AnswerThis',
    location: 'Remote',
    workplace: 'remote',
    area: 'engineering',
    skills: ['TypeScript', 'React'],
    tags: ['Full stack', 'Early team'],
  },
  {
    title: 'Engineer, GTM, or ops — BPO automation',
    company: 'Kaizen',
    location: 'Remote',
    workplace: 'remote',
    area: 'gtm',
    skills: [],
    tags: ['Automation', 'Operations', 'Multi-role'],
  },
  {
    title: 'Software engineer',
    company: 'Nango',
    location: 'Remote',
    workplace: 'remote',
    area: 'engineering',
    skills: ['TypeScript', 'Go', 'Python'],
    tags: ['APIs', 'Integrations', 'Agents'],
  },
  {
    title: 'Software engineer',
    company: '9 Mothers Defense',
    location: 'Austin, TX',
    workplace: 'onsite',
    area: 'engineering',
    skills: ['Go', 'Security', 'Infrastructure'],
    tags: ['Defense', 'Systems'],
  },
  {
    title: 'Founding platform engineer',
    company: 'Converge',
    location: 'New York, NY',
    workplace: 'onsite',
    area: 'engineering',
    skills: ['Infrastructure', 'Go', 'Rust'],
    tags: ['Infrastructure', 'Founding'],
  },
  {
    title: 'Product manager or product / data engineer',
    company: 'Hive',
    location: 'Remote',
    workplace: 'remote',
    area: 'product',
    skills: [],
    tags: ['Data products', 'Analytics', 'Scrappy'],
  },
  {
    title: 'Software engineer',
    company: 'Meticulous',
    location: 'Remote',
    workplace: 'remote',
    area: 'engineering',
    skills: ['TypeScript', 'Open source'],
    tags: ['Developer tools', 'Testing', 'Product quality'],
  },
  {
    title: 'Open roles — engineering, growth, product',
    company: 'SigNoz',
    location: 'Remote',
    workplace: 'remote',
    area: 'engineering',
    skills: ['Go', 'Open source', 'Infrastructure'],
    tags: ['Observability', 'Open source', 'Multi-track'],
  },
  {
    title: 'Engineering lead',
    company: 'Multifactor',
    location: 'Remote',
    workplace: 'remote',
    area: 'engineering',
    skills: ['TypeScript', 'Security'],
    tags: ['Leadership', 'Identity', 'Security-adjacent'],
  },
  {
    title: 'Customer success engineer',
    company: 'Stardex',
    location: 'Remote',
    workplace: 'remote',
    area: 'customer_success',
    skills: [],
    tags: ['Technical CSM', 'Onboarding', 'Support'],
  },
  {
    title: 'Software engineer',
    company: 'Structured AI',
    location: 'Remote',
    workplace: 'remote',
    area: 'engineering',
    skills: ['ML / AI', 'Python', 'TypeScript'],
    tags: ['Structured data', 'AI'],
  },
  {
    title: 'Security engineer — AI infrastructure',
    company: 'Roboflow',
    location: 'Remote',
    workplace: 'remote',
    area: 'security',
    skills: ['Security', 'ML / AI', 'Python'],
    tags: ['AI infra', 'Cloud', 'Hardening'],
  },
  {
    title: 'Software engineer',
    company: 'Jiga',
    location: 'Remote',
    workplace: 'remote',
    area: 'engineering',
    skills: ['TypeScript', 'Go', 'React'],
    tags: ['Manufacturing', 'Supply chain', 'Full stack'],
  },
  {
    title: 'Software engineer (Python)',
    company: 'Reflex',
    location: 'Remote',
    workplace: 'remote',
    area: 'engineering',
    skills: ['Python', 'Open source'],
    tags: ['Python', 'Web framework', 'Open source'],
  },
  {
    title: 'Enterprise account executive',
    company: 'Kyber',
    location: 'Remote',
    workplace: 'remote',
    area: 'sales',
    skills: [],
    tags: ['Enterprise', 'B2B', 'Closing'],
  },
  {
    title: 'Software engineer',
    company: 'Ubicloud',
    location: 'Turkey, Netherlands, California',
    workplace: 'hybrid',
    area: 'engineering',
    skills: ['Go', 'Infrastructure', 'Rust'],
    tags: ['Cloud', 'Distributed'],
  },
  {
    title: 'Founding reliability engineer',
    company: 'LiteLLM',
    location: 'Remote',
    workplace: 'remote',
    area: 'engineering',
    skills: ['Python', 'Infrastructure'],
    tags: ['SRE', 'LLM infra', 'Founding'],
  },
  {
    title: 'Engineering intern — housing',
    company: 'Bild AI',
    location: 'Remote',
    workplace: 'remote',
    area: 'intern',
    skills: ['TypeScript', 'Python'],
    tags: ['Housing', 'Impact', 'Summer'],
  },
  {
    title: 'Software engineer',
    company: 'Hightouch',
    location: 'Remote',
    workplace: 'remote',
    area: 'engineering',
    skills: ['TypeScript', 'Data engineering'],
    tags: ['Data activation', 'Reverse ETL'],
  },
  {
    title: 'Deployment lead',
    company: 'Trellis AI',
    location: 'Remote',
    workplace: 'remote',
    area: 'gtm',
    skills: [],
    tags: ['Healthcare', 'Medication access', 'Implementation'],
  },
  {
    title: 'Software engineer',
    company: 'Event Horizon Labs',
    location: 'Remote',
    workplace: 'remote',
    area: 'engineering',
    skills: ['ML / AI', 'Python', 'Rust'],
    tags: ['Deep tech', 'Early team'],
  },
  {
    title: 'Software engineer',
    company: 'Corgi Labs',
    location: 'Remote',
    workplace: 'remote',
    area: 'engineering',
    skills: ['Python', 'ML / AI'],
    tags: ['Applied research', 'Small team'],
  },
  {
    title: 'Director of computational biology or AI scientist / engineer',
    company: 'Verge',
    location: 'Remote',
    workplace: 'remote',
    area: 'ml',
    skills: ['ML / AI', 'Python'],
    tags: ['Comp bio', 'Drug discovery', 'Research'],
  },
  {
    title: 'Software engineer',
    company: 'SIM',
    location: 'San Francisco, CA',
    workplace: 'onsite',
    area: 'engineering',
    skills: ['Go', 'Infrastructure', 'Rust'],
    tags: ['Systems', 'High bar'],
  },
  {
    title: 'Designer who codes',
    company: 'Hadrius',
    location: 'Remote',
    workplace: 'remote',
    area: 'design',
    skills: [],
    tags: ['Product design', 'Frontend', 'Prototyping'],
  },
  {
    title: 'AI engineering intern',
    company: 'Bitmovin',
    location: 'Austria',
    workplace: 'onsite',
    area: 'intern',
    skills: ['ML / AI', 'Python', 'TypeScript'],
    tags: ['Summer 2026', 'Video'],
  },
  {
    title: 'Software engineer',
    company: 'Padlet',
    location: 'San Francisco · Singapore',
    workplace: 'hybrid',
    area: 'engineering',
    skills: ['TypeScript', 'React'],
    tags: ['Collaboration', 'Global'],
  },
  {
    title: 'Software engineer — mental health automation',
    company: 'Legion Health',
    location: 'Remote',
    workplace: 'remote',
    area: 'engineering',
    skills: ['Python', 'TypeScript'],
    tags: ['Healthcare', 'Autonomy', 'Backend'],
  },
];

export const categories: { value: Category; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'api', label: 'API' },
  { value: 'security', label: 'Security' },
  { value: 'tools', label: 'Tools' },
  { value: 'ml', label: 'ML' },
  { value: 'devops', label: 'DevOps' },
  { value: 'database', label: 'Database' },
];

export const difficulties: { value: Difficulty | 'all'; label: string }[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];
