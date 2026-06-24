'use client';

import Link from 'next/link';
import { useMemo, useState, useRef, useEffect } from 'react';
import { Briefcase, ChevronDown, MapPin } from 'lucide-react';
import {
  roles,
  roleWorkplaceOptions,
  roleTechnicalSkillFilters,
  isTechnicalRole,
} from '@/lib/data';

/** Match homepage / profile skill tags: lowercase, hyphenated query */
function reposTagHref(label: string) {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/\s*\/\s*/g, '-')
    .replace(/\s+/g, '-');
  return `/repos?tag=${encodeURIComponent(slug)}`;
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
        type="button"
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
              type="button"
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

export function RolesView() {
  const [workplace, setWorkplace] = useState<string>('all');
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(() => new Set());

  const technicalRoles = useMemo(() => roles.filter(isTechnicalRole), []);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  };

  const filtered = technicalRoles.filter((role) => {
    const w = workplace === 'all' || role.workplace === workplace;
    if (selectedSkills.size === 0) return w;
    const skillMatch = role.skills.some((s) => selectedSkills.has(s));
    return w && skillMatch;
  });

  return (
    <main className="layout-container py-8">
      <h2 className="text-xl font-bold mb-6 text-highlight">Find Your Next Role</h2>

      <div className="flex flex-wrap gap-3 mb-4">
        <Dropdown
          label="Workplace"
          value={workplace}
          options={roleWorkplaceOptions}
          onChange={setWorkplace}
        />
      </div>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wide text-highlight mb-2">Skills</p>
        <div className="flex flex-wrap gap-2">
          {roleTechnicalSkillFilters.map((skill) => {
            const on = selectedSkills.has(skill);
            return (
              <Link
                key={skill}
                href={reposTagHref(skill)}
                onClick={(e) => {
                  e.preventDefault();
                  toggleSkill(skill);
                }}
                className={`border-2 border-foreground px-2.5 py-1 text-xs cursor-pointer ${
                  on ? 'bg-foreground text-background' : 'hover:bg-foreground hover:text-background'
                }`}
              >
                {skill}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((role, index) => (
          <div
            key={`${role.company}-${role.title}-${index}`}
            className="border-2 border-foreground p-4 cursor-pointer group hover:bg-foreground/[0.03]"
          >
            <div className="flex items-start gap-3 mb-2">
              <div className="border-2 border-foreground p-1.5 shrink-0">
                <Briefcase className="w-4 h-4 text-highlight" aria-hidden strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold group-hover:underline leading-snug text-highlight">
                  {role.title}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{role.company}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span>{role.location}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {role.tags.map((tag) => (
                <span key={tag} className="border border-foreground px-1.5 py-0.5 text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="border-2 border-dashed border-foreground/50 p-8 text-center">
          <p>No roles match the selected filters.</p>
        </div>
      )}
    </main>
  );
}
