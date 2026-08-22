export const BADGE_LABEL = "TrustGig";

const BADGE_COLORS = {
  good: "#10B981",
  medium: "#F59E0B",
  none: "#9CA3AF",
} as const;

const GOOD_SCORE_THRESHOLD = 70;
const MEDIUM_SCORE_THRESHOLD = 40;

export function getBadgeColor(score: number, dealCount: number): string {
  if (dealCount === 0) {
    return BADGE_COLORS.none;
  }

  if (score >= GOOD_SCORE_THRESHOLD) {
    return BADGE_COLORS.good;
  }

  if (score >= MEDIUM_SCORE_THRESHOLD) {
    return BADGE_COLORS.medium;
  }

  return BADGE_COLORS.none;
}

export function generateBadgeSvg(
  label: string,
  score: string,
  dealCount: number,
  color: string,
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

  ${dealCount > 0 ? `<text x="${labelWidth + scoreWidth / 2}" y="${height - 4}" text-anchor="middle" class="deals">${dealCount} deal${dealCount > 1 ? "s" : ""}</text>` : ""}
</svg>`.trim();
}

export function generateNoDataBadge(): string {
  return generateBadgeSvg(BADGE_LABEL, "no data", 0, BADGE_COLORS.none);
}

export function generateScoreBadge(score: number, dealCount: number): string {
  if (dealCount === 0) {
    return generateNoDataBadge();
  }

  return generateBadgeSvg(
    BADGE_LABEL,
    `${score}/100`,
    dealCount,
    getBadgeColor(score, dealCount),
  );
}

/**
 * Headers shared by every badge response. Errors use a shorter cache so a
 * transient failure does not pin a "no data" badge for long.
 */
export function badgeSvgHeaders(cacheControl: string): Record<string, string> {
  return {
    "Content-Type": "image/svg+xml",
    "Cache-Control": cacheControl,
    "Access-Control-Allow-Origin": "*",
  };
}

export const BADGE_CACHE_CONTROL = "public, max-age=300, s-maxage=600";
export const BADGE_ERROR_CACHE_CONTROL = "public, max-age=60";
