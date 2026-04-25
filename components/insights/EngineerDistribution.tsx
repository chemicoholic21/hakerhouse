"use client";

import React from "react";

const categories = [
  { name: "Frontend", fillPercent: 85 },
  { name: "Backend", fillPercent: 70 },
  { name: "AI", fillPercent: 40 },
  { name: "Mobile", fillPercent: 55 },
];

export function EngineerDistribution() {
  const columns = 12;
  const rows = 4;
  const totalBlocks = columns * rows;

  return (
    <div className="flex gap-8 overflow-x-auto pb-2 items-center">
      <div className="flex gap-4">
        {categories.map((category) => {
          const filledBlocks = Math.round((category.fillPercent / 100) * totalBlocks);

          return (
            <div key={category.name} className="flex flex-col gap-1">
              <div
                className="grid gap-[2px]"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: totalBlocks }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-3 sm:w-2.5 sm:h-4 border border-[#333] ${
                      i < filledBlocks ? "bg-[#4a4a4a] border-[#6b7280]" : "bg-[#0a0a0a]"
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 border-l border-dashed border-[#333] pl-4 font-mono text-xs text-gray-400">
        {categories.map((category) => (
          <div key={category.name} className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#4a4a4a] border border-[#6b7280]"></div>
            {category.name}
          </div>
        ))}
      </div>
    </div>
  );
}
