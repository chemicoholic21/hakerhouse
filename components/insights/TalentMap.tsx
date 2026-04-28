"use client";

import React, { useState, useEffect } from "react";
import WorldMap from "@/components/ui/world-map";
import { MapTooltip } from "./MapTooltip";

export function TalentMap({ data }: { data: any[] }) {
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  if (!isMounted) return null;

  const points = data.map(city => ({
    lat: city.lat,
    lng: city.lng,
    size: city.dev_count > 100 ? 6 : city.dev_count > 10 ? 4 : 2,
    label: city.dev_count > 10 ? city.region : undefined,
    ...city
  }));

  const sortedData = [...data].sort((a, b) => b.dev_count - a.dev_count);

  return (
    <div className="w-full">
      {/* Mobile Text List View */}
      <div className="block md:hidden border border-dashed border-[#00E5CC] p-4 bg-[#0a0a0a]">
        <h2 className="text-[#00E5CC] font-mono mb-4 text-sm font-bold uppercase">Top Developer Hubs</h2>
        <div className="space-y-4">
          {sortedData.map((city, i) => (
            <div key={i} className="flex flex-col gap-1 text-xs font-mono border-b border-dashed border-[#1a1a1a] pb-2 last:border-0 last:pb-0">
              <div className="text-[#00E5CC] font-bold">{city.region}</div>
              <div className="flex justify-between text-white">
                <span className="text-gray-400">Devs:</span> {city.dev_count.toLocaleString()}
              </div>
              <div className="flex justify-between text-white">
                <span className="text-gray-400">Top:</span> @{city.top_contributor} ({city.top_score.toLocaleString()})
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Map View */}
      <div 
        className="hidden md:block relative w-full aspect-[2/1] border border-dashed border-[#00E5CC] bg-[#0a0a0a] overflow-hidden" 
        onMouseMove={handleMouseMove}
      >
        <WorldMap 
          points={points} 
          lineColor="#00E5CC" 
          onPointHover={(point) => setTooltipData(point as any)}
          onPointLeave={() => setTooltipData(null)}
        />

        {tooltipData && (
          <div style={{ position: 'fixed', left: tooltipPos.x + 15, top: tooltipPos.y + 15, zIndex: 1000 }}>
            <MapTooltip data={tooltipData} />
          </div>
        )}
      </div>
    </div>
  );
}

