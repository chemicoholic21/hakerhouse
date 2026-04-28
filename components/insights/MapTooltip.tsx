import React from "react";

export function MapTooltip({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="absolute z-50 pointer-events-none bg-[#0a0a0a] border border-dashed border-[#00E5CC] p-3 text-xs md:text-sm font-mono text-white whitespace-pre translate-x-3 -translate-y-1/2 shadow-none">
      <div className="text-[#00E5CC] font-bold mb-1 uppercase">{data.region}</div>
      <div><span className="text-gray-400">devs       :</span> {data.dev_count.toLocaleString()}</div>
      <div><span className="text-gray-400">avg score  :</span> {data.avg_impact.toLocaleString()}</div>
      <div><span className="text-gray-400">top dev    :</span> @{data.top_contributor} ({data.top_score.toLocaleString()})</div>
    </div>
  );
}
