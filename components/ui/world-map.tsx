"use client";

import { useRef } from "react";
import DottedMap from "dotted-map";

import { useTheme } from "next-themes";

interface MapProps {
  points?: Array<{ lat: number; lng: number; label?: string; size?: number }>;
  lineColor?: string;
  onPointHover?: (point: { lat: number; lng: number; label?: string }) => void;
  onPointLeave?: () => void;
}

export default function WorldMap({
  points = [],
  lineColor = "#0ea5e9",
  onPointHover,
  onPointLeave,
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Use DottedMap class as getMap is not available in this version
  const map = new DottedMap({ height: 100, grid: "diagonal" });

  // Force the map to cover the full world by adding corner pins at absolute boundaries
  // This ensures the equirectangular projection aligns correctly
  map.addPin({ lat: -90, lng: -180, svgOptions: { color: "transparent", radius: 0 } });
  map.addPin({ lat: 90, lng: 180, svgOptions: { color: "transparent", radius: 0 } });

  // Add our points to the dotted map so they are part of the background dots
  points.forEach(point => {
    map.addPin({ lat: point.lat, lng: point.lng, svgOptions: { color: lineColor, radius: 0.5 } });
  });

  const { theme } = useTheme();

  const svgMap = map.getSVG({
    radius: 0.3,
    color: "#2a2a2a", // Dark gray dots for the map
    shape: "circle",
    backgroundColor: "transparent",
  });

  const projectPoint = (lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  return (
    <div className="w-full h-full dark:bg-black bg-[#0a0a0a] rounded-lg relative font-sans">
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="h-full w-full pointer-events-none select-none object-fill"
        alt="world map"
        draggable={false}
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        preserveAspectRatio="none"
        className="w-full h-full absolute inset-0 pointer-events-auto select-none"
      >
        {/* Single points mapping */}
        {points.map((point, i) => {
           const p = projectPoint(point.lat, point.lng);
           return (
             <g 
                key={`single-point-${i}`}
                onMouseEnter={() => onPointHover?.(point)}
                onMouseLeave={() => onPointLeave?.()}
                style={{ cursor: "crosshair" }}
              >
               <circle
                 cx={p.x}
                 cy={p.y}
                 r={point.size || 4}
                 fill={lineColor}
                 className="opacity-70"
               />
               <circle
                 cx={p.x}
                 cy={p.y}
                 r={point.size || 4}
                 fill={lineColor}
                 opacity="0.3"
               >
                 <animate
                   attributeName="r"
                   from={point.size || 4}
                   to={(point.size || 4) * 3}
                   dur="2s"
                   begin="0s"
                   repeatCount="indefinite"
                 />
                 <animate
                   attributeName="opacity"
                   from="0.3"
                   to="0"
                   dur="2s"
                   begin="0s"
                   repeatCount="indefinite"
                 />
               </circle>
             </g>
           );
        })}
      </svg>
    </div>
  );
}
