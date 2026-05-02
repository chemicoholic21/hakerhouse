import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cityCoordinates } from '@/lib/geo/cityCoordinates';
import {
  getApiRateLimiter,
  getClientIdentifier,
  checkRateLimit,
  rateLimitExceededResponse,
} from "@/lib/rate-limit"

interface MapDataRow {
  region: string | null;
  dev_count: number;
  avg_impact: number;
  top_contributor: string;
  top_score: number;
}

interface SqlQueryResult {
  rows?: MapDataRow[];
}

export async function GET(request?: Request) {
  // Rate limiting - only apply for external requests (when request object is provided)
  if (request) {
    const rateLimiter = getApiRateLimiter()
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await checkRateLimit(clientId, rateLimiter)

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult)
    }
  }

  try {
    const data = await sql.query(`
      WITH Ranked AS (
        SELECT location, username, total_score,
          ROW_NUMBER() OVER(PARTITION BY location ORDER BY total_score DESC) as rn
        FROM leaderboard
        WHERE location IS NOT NULL AND location != ''
      )
      SELECT
        l.location as region,
        COUNT(l.username)::int as dev_count,
        ROUND(AVG(l.total_score))::int as avg_impact,
        MAX(r.username) as top_contributor,
        MAX(r.total_score)::int as top_score
      FROM leaderboard l
      JOIN Ranked r ON l.location = r.location AND r.rn = 1
      WHERE l.location IS NOT NULL AND l.location != ''
      GROUP BY l.location, r.username, r.total_score
    `) as SqlQueryResult;

    const rows: MapDataRow[] = Array.isArray(data) ? data : (data.rows || []);
    const result = rows.map((row) => {
      let lat = 0, lng = 0;
      // Guard against null/undefined region values
      const region = row.region || '';
      for (const [city, coords] of Object.entries(cityCoordinates)) {
        if (region.toLowerCase().includes(city.toLowerCase())) {
          lat = coords.lat;
          lng = coords.lng;
          break;
        }
      }
      return {
        region: row.region,
        dev_count: Number(row.dev_count),
        avg_impact: Number(row.avg_impact),
        top_contributor: row.top_contributor,
        top_score: Number(row.top_score),
        lat,
        lng
      };
    }).filter((row) => row.lat !== 0 || row.lng !== 0);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Map data fetch error:", error);
    return NextResponse.json({ error: 'Failed to fetch map data' }, { status: 500 });
  }
}
