'use client';

import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

interface SkillsRadarProps {
  data?: {
    skill: string;
    count: number;
  }[];
}

const defaultData = [
  { subject: 'Rust', A: 120, fullMark: 150 },
  { subject: 'React', A: 98, fullMark: 150 },
  { subject: 'TypeScript', A: 140, fullMark: 150 },
  { subject: 'Python', A: 85, fullMark: 150 },
  { subject: 'AI', A: 110, fullMark: 150 },
];

export function SkillsRadar({ data }: SkillsRadarProps) {
  const maxCount = data && data.length > 0 ? Math.max(...data.map((d) => d.count)) : 150;
  const chartData =
    data && data.length > 0
      ? data.map((item) => ({
          subject: item.skill,
          A: item.count,
          fullMark: maxCount,
        }))
      : defaultData;

  return (
    <div className="w-full h-[200px] font-mono text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, maxCount]} tick={false} axisLine={false} />
          <Radar name="Skills" dataKey="A" stroke="#00E5CC" fill="#00E5CC" fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
