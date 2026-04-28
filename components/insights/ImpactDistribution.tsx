"use client";

import React from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ImpactDistributionProps {
  data?: {
    bucket: number;
    count: number;
  }[];
}

const defaultData = [
  { name: "0", count: 5 },
  { name: "3k", count: 15 },
  { name: "6k", count: 45 },
  { name: "9k", count: 70 },
  { name: "12k", count: 95 },
  { name: "15k", count: 120 },
  { name: "18k", count: 98 },
  { name: "21k", count: 60 },
  { name: "24k", count: 40 },
  { name: "27k", count: 25 },
  { name: "30k+", count: 10 },
];

export function ImpactDistribution({ data }: ImpactDistributionProps) {
  const chartData = data && data.length > 0 
    ? data.map(item => ({
        name: `${(item.bucket - 1) * 50}`,
        count: item.count
      })) 
    : defaultData;

  return (
    <div className="w-full h-[250px] font-mono text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 30, left: 0 }}
        >
          <CartesianGrid stroke="#1a1a1a" vertical={false} strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            stroke="#4a4a4a" 
            tick={{ fill: "#6b7280", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "#333" }}
            label={{ value: "IMPACT SCORE", position: "insideBottom", offset: -15, fill: "#6b7280", fontSize: 10 }}
          />
          <YAxis 
            stroke="#4a4a4a" 
            tick={{ fill: "#6b7280", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "#333" }}
            label={{ value: "ENGINEERS", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: "#0a0a0a", border: "1px dashed #00E5CC", color: "#fff" }}
            itemStyle={{ color: "#00E5CC" }}
            cursor={{ fill: "#1a1a1a" }}
          />
          <Bar dataKey="count" barSize={20} fill="transparent" stroke="#00E5CC" strokeWidth={1} />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#00E5CC" 
            strokeWidth={2} 
            dot={{ r: 3, fill: "#0a0a0a", stroke: "#00E5CC", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

