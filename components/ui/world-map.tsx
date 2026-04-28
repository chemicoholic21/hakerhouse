"use client";

import { useEffect, useRef, useState } from "react";
import DottedMap from "dotted-map";

interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

interface WorldMapProps {
  points?: MapPoint[];
  dotColor?: string;
  backgroundColor?: string;
  pinColor?: string;
  className?: string;
}

export function WorldMap({
  points = [],
  dotColor = "#64748b",
  backgroundColor = "transparent",
  pinColor = "#22c55e",
  className = "",
}: WorldMapProps) {
  const [svgContent, setSvgContent] = useState<string>("");

  useEffect(() => {
    // Create a new dotted map
    const map = new DottedMap({ height: 60, grid: "diagonal" });

    // Force the map to cover the full world by adding corner pins at absolute boundaries
    // This ensures the equirectangular projection aligns correctly
    map.addPin({
      lat: -90,
      lng: -180,
      svgOptions: { color: "transparent", radius: 0 },
    });
    map.addPin({
      lat: 90,
      lng: 180,
      svgOptions: { color: "transparent", radius: 0 },
    });

    // Add our points to the dotted map so they are part of the background dots
    points.forEach((point) => {
      map.addPin({
        lat: point.lat,
        lng: point.lng,
        svgOptions: {
          color: point.color || pinColor,
          radius: 0.6,
        },
      });
    });

    // Generate the SVG
    const svg = map.getSVG({
      radius: 0.22,
      color: dotColor,
      shape: "circle",
      backgroundColor: backgroundColor,
    });

    setSvgContent(svg);
  }, [points, dotColor, backgroundColor, pinColor]);

  return (
    <div
      className={`w-full h-full ${className}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

export default WorldMap;
