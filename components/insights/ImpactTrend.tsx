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
  { day: "Jan 1", impact: 120 },
  { day: "Jan 5", impact: 130 },
  { day: "Jan 10", impact: 125 },
  { day: "Jan 15", impact: 145 },
  { day: "Jan 20", impact: 150 },
  { day: "Jan 25", impact: 160 },
  { day: "Jan 30", impact: 180 },
];

/**
 * Format date to show "Mon D" format (e.g., "Jan 15")
 * This preserves month context when data spans multiple months
 */
function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString; // Return original if invalid
  }
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

export function ImpactTrend({ data }: ImpactTrendProps) {
  const chartData = data && data.length > 0
    ? data.map((item) => ({
        day: formatDateLabel(item.day),
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

