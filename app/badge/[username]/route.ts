import { NextRequest, NextResponse } from "next/server";
import { computeReputationScore, type Deal } from "../../../lib/ai";
import {
  BADGE_CACHE_CONTROL,
  BADGE_ERROR_CACHE_CONTROL,
  badgeSvgHeaders,
  generateNoDataBadge,
  generateScoreBadge,
} from "../../../lib/badge";

export const runtime = "nodejs";

// Mock Supabase data fetching - replace with actual Supabase client when configured
async function fetchUserDeals(username: string): Promise<Deal[]> {
  // TODO: Replace with actual Supabase query:
  // const { data, error } = await supabase
  //   .from('deals')
  //   .select('status, was_paid_on_time, rating')
  //   .eq('username', username);

  // For now, return empty array (no data scenario)
  return [];
}

function svgResponse(svg: string, cacheControl: string): NextResponse {
  return new NextResponse(svg, { headers: badgeSvgHeaders(cacheControl) });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Remove .svg extension if present
  const cleanUsername = username.replace(/\.svg$/, '');

  try {
    const deals = await fetchUserDeals(cleanUsername);
    const reputation = computeReputationScore(deals);

    return svgResponse(
      generateScoreBadge(reputation.score, reputation.dealCount),
      BADGE_CACHE_CONTROL,
    );
  } catch (error) {
    console.error("Error generating badge:", error);

    // Always return a valid SVG, never error
    return svgResponse(generateNoDataBadge(), BADGE_ERROR_CACHE_CONTROL);
  }
}
