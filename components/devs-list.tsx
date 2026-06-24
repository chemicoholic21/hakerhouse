'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User,
  ChevronDown,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Search,
  MapPin,
} from 'lucide-react';
import { TopicCombobox } from './topic-combobox';

export interface DevRow {
  name: string;
  username: string;
  country: string;
  language: string;
  skills: string[];
  score: number;
}

function impactScore(dev: DevRow): number {
  return dev.score || 0;
}

function devTopics(dev: DevRow): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (t: string) => {
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };
  push(dev.language);
  for (const s of dev.skills) push(s);
  return out;
}

function formatRank(n: number) {
  return String(n).padStart(2, '0');
}

function formatScore(n: number) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label || label;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="border-2 border-foreground px-3 py-1 text-sm flex items-center gap-2 hover:bg-foreground hover:text-background"
      >
        <span>
          {label}: {selectedLabel}
        </span>
        <ChevronDown className={`w-3 h-3 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 border-2 border-foreground bg-background z-50 min-w-full max-h-48 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-foreground hover:text-background ${
                value === option.value ? 'bg-foreground/10' : ''
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DevsList({
  initialDevs,
  skillsList,
  languages,
  countries,
  pagination,
}: {
  initialDevs: DevRow[];
  skillsList: { value: string; label: string }[];
  languages: { value: string; label: string }[];
  countries: { value: string; label: string }[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read current filters from URL
  const currentSkill = searchParams.get('skill') || 'all';
  const currentLanguage = searchParams.get('language') || 'all';
  const currentCountry = searchParams.get('country') || 'all';
  const currentOpenTo = searchParams.get('openTo') || 'all';
  const currentUsername = searchParams.get('username') || '';
  const currentLocation = searchParams.get('location') || '';
  // Topics can be comma-separated for multiple values
  const currentTopics = searchParams.get('topics')?.split(',').filter(Boolean) || [];

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all' || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Reset to page 1 when filter changes
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const updateTopics = (topics: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (topics.length === 0) {
      params.delete('topics');
    } else {
      params.set('topics', topics.join(','));
    }
    // Reset to page 1 when filter changes
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-highlight">Find Developers</h2>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            key={currentUsername}
            type="text"
            placeholder="Filter by name or username..."
            defaultValue={currentUsername}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateFilter('username', e.currentTarget.value);
              }
            }}
            onBlur={(e) => {
              if (e.currentTarget.value !== currentUsername) {
                updateFilter('username', e.currentTarget.value);
              }
            }}
            className="w-full bg-background border-2 border-foreground pl-10 pr-3 py-1 text-sm focus:outline-none focus:bg-foreground focus:text-background placeholder:text-muted-foreground"
          />
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            key={currentLocation}
            type="text"
            placeholder="Filter by location..."
            defaultValue={currentLocation}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateFilter('location', e.currentTarget.value);
              }
            }}
            onBlur={(e) => {
              if (e.currentTarget.value !== currentLocation) {
                updateFilter('location', e.currentTarget.value);
              }
            }}
            className="w-full bg-background border-2 border-foreground pl-10 pr-3 py-1 text-sm focus:outline-none focus:bg-foreground focus:text-background placeholder:text-muted-foreground"
          />
        </div>
        <TopicCombobox
          selectedTopics={currentTopics}
          onChange={updateTopics}
          placeholder="Filter by topics..."
        />
        <Dropdown
          label="Skill"
          value={currentSkill}
          options={skillsList}
          onChange={(val) => updateFilter('skill', val)}
        />
        <Dropdown
          label="Language"
          value={currentLanguage}
          options={languages}
          onChange={(val) => updateFilter('language', val)}
        />
        <Dropdown
          label="Country"
          value={currentCountry}
          options={countries}
          onChange={(val) => updateFilter('country', val)}
        />
      </div>

      {initialDevs.length > 0 ? (
        <section className="border-2 border-dashed border-foreground/70 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-highlight">
              <TrendingUp className="w-5 h-5 shrink-0" strokeWidth={2.5} />
              Developers
            </h3>
            <span className="text-sm text-muted-foreground tabular-nums">
              Showing {initialDevs.length} of {pagination.totalItems}
            </span>
          </div>

          <div className="overflow-x-auto -mx-1 px-1 mb-4">
            <div className="border-y border-foreground min-w-[min(100%,40rem)] grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,6.75rem)_minmax(0,5.5rem)_minmax(0,1fr)_7rem] gap-x-3">
              <div className="col-span-full grid grid-cols-subgrid gap-x-3 items-center py-[9px] px-2 text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-foreground">
                <span className="text-right tabular-nums">#</span>
                <span className="min-w-0 text-left">Name</span>
                <span className="min-w-0 truncate text-left">Handle</span>
                <span className="min-w-0 truncate text-left">Location</span>
                <span className="min-w-0 truncate text-left">Topics</span>
                <span className="text-right tabular-nums whitespace-nowrap">Score</span>
              </div>
              {initialDevs.map((dev, index) => (
                <Link
                  key={dev.username}
                  href={`/${dev.username}`}
                  className="col-span-full grid grid-cols-subgrid gap-x-3 items-center border-b border-foreground py-[11px] px-2 last:border-b-0 hover:bg-foreground hover:text-background cursor-pointer group/link"
                >
                  <span className="text-right text-sm tabular-nums">
                    {formatRank((pagination.currentPage - 1) * pagination.itemsPerPage + index + 1)}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                    <span className="truncate text-sm font-medium group-hover/link:underline min-w-0">
                      {dev.name}
                    </span>
                  </div>
                  <span className="text-sm font-mono truncate min-w-0 text-muted-foreground group-hover/link:text-background/80">
                    {dev.username}
                  </span>
                  <span className="text-sm truncate min-w-0 text-muted-foreground group-hover/link:text-background/80">
                    {dev.country}
                  </span>
                  <span className="text-sm truncate min-w-0 text-muted-foreground group-hover/link:text-background/80">
                    {devTopics(dev).join(' · ')}
                  </span>
                  <span className="text-sm text-right tabular-nums whitespace-nowrap">
                    {formatScore(impactScore(dev))}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => updatePage(Math.max(1, pagination.currentPage - 1))}
                disabled={pagination.currentPage <= 1}
                className="p-2 border-2 border-foreground hover:bg-foreground hover:text-background disabled:opacity-50 disabled:hover:bg-background disabled:hover:text-foreground disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  updatePage(Math.min(pagination.totalPages, pagination.currentPage + 1))
                }
                disabled={pagination.currentPage >= pagination.totalPages}
                className="p-2 border-2 border-foreground hover:bg-foreground hover:text-background disabled:opacity-50 disabled:hover:bg-background disabled:hover:text-foreground disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      ) : (
        <div className="border-2 border-dashed border-foreground/50 p-8 text-center">
          <p>No developers match the selected filters.</p>
        </div>
      )}
    </>
  );
}
