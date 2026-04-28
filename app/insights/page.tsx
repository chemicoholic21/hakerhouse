"use client";

import { WorldMap } from "@/components/ui/world-map";

const samplePoints = [
  { lat: 40.7128, lng: -74.006, label: "New York" },
  { lat: 51.5074, lng: -0.1278, label: "London" },
  { lat: 35.6762, lng: 139.6503, label: "Tokyo" },
  { lat: -33.8688, lng: 151.2093, label: "Sydney" },
  { lat: 48.8566, lng: 2.3522, label: "Paris" },
  { lat: 37.7749, lng: -122.4194, label: "San Francisco" },
  { lat: 52.52, lng: 13.405, label: "Berlin" },
  { lat: 55.7558, lng: 37.6173, label: "Moscow" },
  { lat: 1.3521, lng: 103.8198, label: "Singapore" },
  { lat: -23.5505, lng: -46.6333, label: "Sao Paulo" },
];

export default function InsightsMapPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Global Insights</h1>
      <p className="text-muted-foreground mb-8">
        Explore developer activity around the world
      </p>

      <div className="w-full aspect-[2/1] bg-card rounded-lg border overflow-hidden">
        <WorldMap
          points={samplePoints}
          dotColor="#94a3b8"
          backgroundColor="transparent"
          pinColor="#22c55e"
        />
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
        {samplePoints.map((point, index) => (
          <div key={index} className="p-3 bg-card rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">{point.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
