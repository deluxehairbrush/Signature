import { NextRequest, NextResponse } from "next/server";
import { computeReputationScore, type Deal, type ReputationScore } from "../../../lib/ai";

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

function getBadgeColor(score: number, dealCount: number): string {
  if (dealCount === 0) {
    return "#9CA3AF"; // gray for no data
  }
  if (score >= 70) {
    return "#10B981"; // green for 70+
  }
  if (score >= 40) {
    return "#F59E0B"; // yellow for 40-69
  }
  return "#9CA3AF"; // gray for under 40
}

function generateBadgeSvg(
  label: string,
  score: string,
  dealCount: number,
  color: string
): string {
  const width = 200;
  const height = 30;
  const labelWidth = 80;
  const scoreWidth = width - labelWidth;
  
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <style>
    .label { font: 600 12px sans-serif; fill: #fff; }
    .score { font: 600 12px sans-serif; fill: #fff; }
    .deals { font: 400 10px sans-serif; fill: #fff; }
  </style>
  
  <!-- Left side (label) -->
  <rect x="0" y="0" width="${labelWidth}" height="${height}" fill="#555"/>
  <text x="${labelWidth / 2}" y="${height / 2 + 4}" text-anchor="middle" class="label">${label}</text>
  
  <!-- Right side (score) -->
  <rect x="${labelWidth}" y="0" width="${scoreWidth}" height="${height}" fill="${color}"/>
  <text x="${labelWidth + scoreWidth / 2}" y="${height / 2 + 4}" text-anchor="middle" class="score">${score}</text>
  
  ${dealCount > 0 ? `<text x="${labelWidth + scoreWidth / 2}" y="${height - 4}" text-anchor="middle" class="deals">${dealCount} deal${dealCount > 1 ? 's' : ''}</text>` : ''}
</svg>`.trim();
}

function generateNoDataBadge(): string {
  return generateBadgeSvg("TrustGig", "no data", 0, "#9CA3AF");
}

function generateUnavailableBadge(): string {
  return generateBadgeSvg("TrustGig", "unavailable", 0, "#9CA3AF");
}

function svgResponse(
  svg: string,
  { cacheControl, error }: { cacheControl: string; error?: string },
): NextResponse {
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": cacheControl,
      "Access-Control-Allow-Origin": "*",
      // Lets embedders and monitoring tell a degraded badge apart from a
      // genuine "no deals yet" badge, which both render as an image.
      ...(error ? { "X-Badge-Status": error } : {}),
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Remove .svg extension if present
  const cleanUsername = username.replace(/\.svg$/, '');

  if (!cleanUsername.trim()) {
    return svgResponse(generateNoDataBadge(), {
      cacheControl: "public, max-age=300, s-maxage=600",
      error: "invalid-username",
    });
  }

  try {
    // Fetch user's deals from Supabase
    const deals = await fetchUserDeals(cleanUsername);
    
    // Compute reputation score
    const reputation = computeReputationScore(deals);
    
    // Generate badge SVG
    let svg: string;
    
    if (reputation.dealCount === 0) {
      svg = generateNoDataBadge();
    } else {
      const color = getBadgeColor(reputation.score, reputation.dealCount);
      svg = generateBadgeSvg(
        "TrustGig",
        `${reputation.score}/100`,
        reputation.dealCount,
        color
      );
    }
    
    // Return SVG with appropriate headers
    return svgResponse(svg, {
      cacheControl: "public, max-age=300, s-maxage=600",
    });
  } catch (error) {
    console.error(`Failed to generate badge for "${cleanUsername}"`, error);

    // Badges are embedded as images, so the endpoint still renders SVG instead
    // of an error page. It must not claim "no data": the reputation lookup
    // failed, so say so and keep the failure out of shared caches.
    return svgResponse(generateUnavailableBadge(), {
      cacheControl: "no-store",
      error: "reputation-unavailable",
    });
  }
}