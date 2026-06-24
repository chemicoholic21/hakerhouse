import Link from 'next/link';
import { TrendingUp, User, Search } from 'lucide-react';
import { sql } from '@/lib/db';

function formatRank(n: number) {
  return String(n).padStart(2, '0');
}

function formatScore(n: number) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

interface LeaderboardRow {
  username: string;
  name: string | null;
  total_score: number | null;
}

export async function WeeklyLeaderboard() {
  const dbData = (await sql`
    SELECT username, name, total_score
    FROM leaderboard
    ORDER BY total_score DESC
    LIMIT 5
  `) as LeaderboardRow[];

  const leaderboardData = dbData.map((row: LeaderboardRow, i: number) => ({
    rank: i + 1,
    name: row.name || row.username,
    handle: row.username,
    score: row.total_score || 0,
  }));

  return (
    <section className="border-2 border-dashed border-foreground/70 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-highlight">
          <TrendingUp className="w-5 h-5 shrink-0" strokeWidth={2.5} />
          Leaderboard
        </h2>
      </div>

      <div className="mb-4">
        <form action="/devs" method="GET" className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            name="username"
            placeholder="Search engineer..."
            className="w-full bg-background border-2 border-foreground pl-10 pr-3 py-1.5 text-sm focus:outline-none focus:bg-foreground focus:text-background placeholder:text-muted-foreground"
          />
        </form>
      </div>

      <div className="border-y border-foreground">
        <div className="grid grid-cols-[2.5rem_1fr_auto] gap-x-3 items-center py-[9px] px-2 text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-foreground">
          <span className="text-right">Rank</span>
          <span>Engineer</span>
          <span className="text-right tabular-nums">Impact Score</span>
        </div>
        <div className="divide-y divide-foreground">
          {leaderboardData.map((dev) => (
            <Link
              key={dev.handle}
              href={`/${dev.handle}`}
              className="grid grid-cols-[2.5rem_1fr_auto] gap-x-3 items-center py-[11px] px-2 hover:bg-foreground hover:text-background cursor-pointer group/link"
            >
              <span className="text-right text-sm tabular-nums">{formatRank(dev.rank)}</span>
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-3.5 h-3.5 shrink-0" />
                <div className="flex flex-col min-w-0 text-sm leading-tight">
                  <span className="truncate group-hover/link:underline">{dev.name}</span>
                  {dev.handle !== dev.name ? (
                    <span className="truncate text-muted-foreground text-xs group-hover/link:text-background/80">
                      {dev.handle}
                    </span>
                  ) : null}
                </div>
              </div>
              <span className="text-sm text-right tabular-nums">{formatScore(dev.score)}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <Link href="/devs" className="text-sm hover:underline">
          See full leaderboard &gt;
        </Link>
      </div>
    </section>
  );
}
