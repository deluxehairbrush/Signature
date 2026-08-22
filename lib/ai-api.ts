import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const FALLBACK_MESSAGE =
  "Couldn't auto-generate the summary, you can fill it in manually";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const MAX_BODY_BYTES = 64_000;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export function jsonError(
  status: number,
  error: string,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      ok: false,
      error,
      fallbackMessage: FALLBACK_MESSAGE,
      ...details,
    },
    { status },
  );
}

export async function parseJsonBody<T>(
  request: NextRequest,
  schema: z.ZodType<T>,
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const rawBody = await request.text();

    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return {
        success: false,
        response: jsonError(413, "Request body is too large."),
      };
    }

    const body = JSON.parse(rawBody);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return {
        success: false,
        response: jsonError(400, "Invalid request body.", {
          issues: parsed.error.issues,
        }),
      };
    }

    return { success: true, data: parsed.data };
  } catch {
    return {
      success: false,
      response: jsonError(400, "Request body must be valid JSON."),
    };
  }
}

export function enforceRateLimit(request: NextRequest, action: string) {
  const key = `${action}:${getRequesterId(request)}`;
  const now = Date.now();

  // Per-process memory only: on serverless (Vercel) each instance has its own
  // map, so the effective limit is RATE_LIMIT_MAX_REQUESTS * instances. Fine
  // as a basic abuse guard, not a hard quota.
  if (rateLimitBuckets.size > 10_000) {
    for (const [bucketKey, existingBucket] of rateLimitBuckets) {
      if (existingBucket.resetAt <= now) {
        rateLimitBuckets.delete(bucketKey);
      }
    }
  }

  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);

    return NextResponse.json(
      {
        ok: false,
        error: "Too many AI requests. Please wait a minute and try again.",
        fallbackMessage: FALLBACK_MESSAGE,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(bucket.resetAt),
        },
      },
    );
  }

  bucket.count += 1;
  return null;
}

export function aiFailureResponse(error: unknown) {
  const status = getErrorStatus(error);

  if (status === 429) {
    return jsonError(503, "Groq is rate-limiting AI requests right now.");
  }

  if (status === 408 || isTimeoutError(error)) {
    return jsonError(504, "Groq timed out while generating the AI response.");
  }

  return jsonError(502, "AI summary generation failed.");
}

function getRequesterId(request: NextRequest): string {
  // Rate-limit identity is IP-based only. The Authorization header's JWT
  // `sub` claim is NOT trusted here: nothing verifies the token's signature
  // yet (no Supabase JWT secret is wired up), so trusting an unverified sub
  // would let anyone mint a fresh rate-limit bucket per request. Revisit once
  // tokens are verified server-side (e.g. with `jose` against the Supabase
  // JWT secret) and key on the verified subject instead.
  //
  // x-forwarded-for is client-spoofable unless the app sits behind a trusted
  // proxy that overwrites it (true on Vercel).
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip");

  return `ip:${forwardedFor || realIp || "unknown"}`;
}

function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }

  return undefined;
}

function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorLike = error as { code?: unknown; name?: unknown; message?: unknown };
  const text = `${String(errorLike.code ?? "")} ${String(errorLike.name ?? "")} ${String(
    errorLike.message ?? "",
  )}`.toLowerCase();

  return text.includes("timeout") || text.includes("timed out");
}
