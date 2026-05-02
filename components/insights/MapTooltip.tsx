import React from "react";

interface MapTooltipData {
  region: string;
  dev_count: number;
  avg_impact: number;
  top_contributor: string;
  top_score: number;
}

export function MapTooltip({ data }: { data: MapTooltipData | null }) {
  if (!data) return null;

  // Safely format numbers with fallbacks
  const devCount = typeof data.dev_count === 'number' ? data.dev_count.toLocaleString() : '0';
  const avgImpact = typeof data.avg_impact === 'number' ? data.avg_impact.toLocaleString() : '0';
  const topScore = typeof data.top_score === 'number' ? data.top_score.toLocaleString() : '0';

  return (
    <div className="absolute z-50 pointer-events-none bg-[#0a0a0a] border border-dashed border-[#00E5CC] p-3 text-xs md:text-sm font-mono text-white whitespace-pre translate-x-3 -translate-y-1/2 shadow-none">
      <div className="text-[#00E5CC] font-bold mb-1 uppercase">{data.region || 'Unknown'}</div>
      <div><span className="text-gray-400">devs       :</span> {devCount}</div>
      <div><span className="text-gray-400">avg score  :</span> {avgImpact}</div>
      <div><span className="text-gray-400">top dev    :</span> @{data.top_contributor || 'N/A'} ({topScore})</div>
    </div>
  );
}
