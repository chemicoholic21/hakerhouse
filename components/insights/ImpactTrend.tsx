"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface ImpactTrendProps {
  data?: {
    day: string;
    avg_impact: number;
  }[];
}

const defaultData = [
  { day: "1", impact: 120 },
  { day: "5", impact: 130 },
  { day: "10", impact: 125 },
  { day: "15", impact: 145 },
  { day: "20", impact: 150 },
  { day: "25", impact: 160 },
  { day: "30", impact: 180 },
];

export function ImpactTrend({ data }: ImpactTrendProps) {
  const chartData = data && data.length > 0 
    ? data.map((item, i) => ({
        day: new Date(item.day).getDate().toString(),
        impact: Math.round(item.avg_impact)
      })) 
    : defaultData;

  return (
    <div className="w-full h-[200px] font-mono text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
          <CartesianGrid stroke="#1a1a1a" vertical={false} />
          <XAxis dataKey="day" stroke="#4a4a4a" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#333" }} />
          <YAxis stroke="#4a4a4a" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} />
          <Line
            type="monotone"
            dataKey="impact"
            stroke="#00E5CC"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

