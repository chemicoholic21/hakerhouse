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
  ReferenceDot,
} from "recharts";

const data = [
  { name: "0", count: 5 },
  { name: "2k", count: 15 },
  { name: "5k", count: 45 },
  { name: "8k", count: 70 },
  { name: "10k", count: 95 },
  { name: "12k", count: 120 },
  { name: "15k", count: 98 },
  { name: "18k", count: 60 },
  { name: "20k", count: 40 },
  { name: "22k", count: 25 },
  { name: "25k+", count: 10 },
];

export function ImpactDistribution() {
  return (
    <div className="w-full h-[250px] font-mono text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 20, bottom: 30, left: 0 }}
        >
          <CartesianGrid stroke="#1a1a1a" vertical={false} strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            stroke="#4a4a4a" 
            tick={{ fill: "#6b7280", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "#333" }}
            label={{ value: "IMPACT SCORE (0, 5k, 10k, 15k, 20k, 25k+)", position: "insideBottom", offset: -15, fill: "#6b7280", fontSize: 10 }}
          />
          <YAxis 
            stroke="#4a4a4a" 
            tick={{ fill: "#6b7280", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "#333" }}
            label={{ value: "NUMBER OF ENGINEERS", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 10 }}
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
          {/* Reference Dot for Taniya Souza */}
          <ReferenceDot x="20k" y={40} r={4} fill="#00E5CC" stroke="none" />
          <svg>
            <path d="M 330 140 L 400 100" stroke="#00E5CC" strokeWidth={1} />
            <text x={330} y={80} fill="#fff" fontSize="10" className="font-mono">
              Taniya Souza's current
            </text>
            <text x={330} y={95} fill="#fff" fontSize="10" className="font-mono">
              percentile location
            </text>
            <text x={330} y={110} fill="#fff" fontSize="10" className="font-mono">
              (top 9%).
            </text>
          </svg>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
