"use client";

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

const data = [
  { subject: "Rust", A: 120, fullMark: 150 },
  { subject: "React", A: 98, fullMark: 150 },
  { subject: "TypeScript", A: 140, fullMark: 150 },
  { subject: "Python", A: 85, fullMark: 150 },
  { subject: "AI", A: 110, fullMark: 150 },
];

export function SkillsRadar() {
  return (
    <div className="w-full h-[200px] font-mono text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
          <Radar
            name="Skills"
            dataKey="A"
            stroke="#00E5CC"
            fill="#00E5CC"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
