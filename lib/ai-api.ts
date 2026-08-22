import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AiConfigError, AiResponseError } from "./errors";

const FALLBACK_MESSAGE =
  "Couldn't auto-generate the summary, you can fill it in manually";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

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
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    // Malformed JSON is a client mistake; anything else (aborted upload,
    // unreadable stream) is worth logging instead of being reported as bad JSON.
    if (error instanceof SyntaxError) {
      return {
        success: false,
        response: jsonError(400, "Request body must be valid JSON."),
      };
    }

    console.error("Failed to read request body", error);

    return {
      success: false,
      response: jsonError(400, "Could not read the request body."),
    };
  }

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
}

export function enforceRateLimit(request: NextRequest, action: string) {
  const key = `${action}:${getRequesterId(request)}`;
  const now = Date.now();
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

/**
 * Maps an AI failure to a status code and message. `action` names the failed
 * operation (for example "summary") so callers do not report a generic
 * summary error for every AI route.
 */
export function aiFailureResponse(error: unknown, action: string) {
  if (error instanceof AiConfigError) {
    // Configuration details stay in the server log; the client only learns the
    // request cannot succeed until an operator fixes the deployment.
    return jsonError(500, "The AI service is not configured on the server.");
  }

  const status = getErrorStatus(error);

  if (status === 429) {
    return jsonError(503, "Groq is rate-limiting AI requests right now.");
  }

  if (status === 408 || isTimeoutError(error)) {
    return jsonError(504, `Groq timed out while generating the ${action}.`);
  }

  if (error instanceof AiResponseError) {
    return jsonError(502, `Groq returned an unusable ${action}.`);
  }

  return jsonError(502, `AI ${action} generation failed.`);
}

function getRequesterId(request: NextRequest): string {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  const supabaseUserId = token ? getJwtSubject(token) : null;

  if (supabaseUserId) {
    return `user:${supabaseUserId}`;
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip");

  return `ip:${forwardedFor || realIp || "unknown"}`;
}

function getJwtSubject(token: string): string | null {
  try {
    const [, payload] = token.split(".");

    if (!payload) {
      return null;
    }

    const decoded = JSON.parse(base64UrlDecode(payload)) as { sub?: unknown };
    return typeof decoded.sub === "string" && decoded.sub ? decoded.sub : null;
  } catch {
    // An unreadable token is not an error here: rate limiting falls back to the
    // caller IP, and the token is never trusted for authorization.
    return null;
  }
}

function base64UrlDecode(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64").toString("utf8");
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
