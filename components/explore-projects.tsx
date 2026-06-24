import { Hash } from 'lucide-react';
import Link from 'next/link';

const trendingTags = [
  'javascript',
  'typescript',
  'rust',
  'golang',
  'python',
  'react',
  'nextjs',
  'ai',
  'machine-learning',
  'cli-tools',
  'devtools',
  'open-source',
  'web3',
  'security',
  'databases',
];

export function ExploreProjects() {
  return (
    <section className="border-2 border-dashed border-foreground/70 p-6">
      <div className="flex items-center gap-2 mb-6 text-highlight">
        <Hash className="w-5 h-5 shrink-0" strokeWidth={2.5} />
        <h2 className="text-xl font-bold">Explore Projects</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {trendingTags.map((tag) => (
          <Link
            key={tag}
            href={`/repos?tag=${tag}`}
            className="border-2 border-foreground/50 px-3 py-1 text-sm hover:bg-foreground hover:text-background"
          >
            #{tag}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        <Link href="/repos" className="text-sm hover:underline">
          Browse all repos &gt;
        </Link>
      </div>
    </section>
  );
}
