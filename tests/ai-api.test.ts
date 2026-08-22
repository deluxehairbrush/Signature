import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";
import {
  aiFailureResponse,
  enforceRateLimit,
  jsonError,
  parseJsonBody,
} from "../lib/ai-api";

function makeRequest({
  body,
  headers,
}: {
  body?: string;
  headers?: Record<string, string>;
} = {}): NextRequest {
  return new NextRequest("http://localhost/api/ai/test", {
    method: "POST",
    body,
    headers,
  });
}

function base64Url(value: string): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function makeJwt(payload: Record<string, unknown>): string {
  return `${base64Url(JSON.stringify({ alg: "none" }))}.${base64Url(
    JSON.stringify(payload),
  )}.signature`;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("jsonError", () => {
  it("returns the status, error, and fallback message", async () => {
    const response = jsonError(400, "Bad input.");
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Bad input.");
    expect(body.fallbackMessage).toMatch(/fill it in manually/);
  });

  it("merges extra details into the body", async () => {
    const response = jsonError(422, "Invalid.", { issues: ["too short"] });
    const body = await response.json();

    expect(body.issues).toEqual(["too short"]);
  });
});

describe("parseJsonBody", () => {
  const schema = z.object({ text: z.string().min(1) });

  it("returns parsed data for a valid body", async () => {
    const request = makeRequest({ body: JSON.stringify({ text: "hello" }) });
    const result = await parseJsonBody(request, schema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ text: "hello" });
    }
  });

  it("returns a 400 response with issues for schema violations", async () => {
    const request = makeRequest({ body: JSON.stringify({ text: 42 }) });
    const result = await parseJsonBody(request, schema);

    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toBe("Invalid request body.");
      expect(Array.isArray(body.issues)).toBe(true);
    }
  });

  it("returns a 400 response for malformed JSON", async () => {
    const request = makeRequest({ body: "{not json" });
    const result = await parseJsonBody(request, schema);

    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toBe("Request body must be valid JSON.");
    }
  });
});

describe("enforceRateLimit", () => {
  it("allows requests under the limit", () => {
    const request = makeRequest({
      headers: { "x-forwarded-for": "10.0.0.1" },
    });

    for (let i = 0; i < 10; i += 1) {
      expect(enforceRateLimit(request, "allow-under-limit")).toBeNull();
    }
  });

  it("returns 429 with rate limit headers once the limit is exceeded", async () => {
    const request = makeRequest({
      headers: { "x-forwarded-for": "10.0.0.2" },
    });

    for (let i = 0; i < 10; i += 1) {
      expect(enforceRateLimit(request, "exceed-limit")).toBeNull();
    }

    const response = enforceRateLimit(request, "exceed-limit");
    expect(response).not.toBeNull();
    expect(response!.status).toBe(429);
    expect(response!.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(response!.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(Number(response!.headers.get("Retry-After"))).toBeGreaterThan(0);
    const body = await response!.json();
    expect(body.error).toMatch(/Too many AI requests/);
  });

  it("tracks separate buckets per IP address", () => {
    const first = makeRequest({ headers: { "x-forwarded-for": "10.0.0.3" } });
    const second = makeRequest({ headers: { "x-forwarded-for": "10.0.0.4" } });

    for (let i = 0; i < 10; i += 1) {
      expect(enforceRateLimit(first, "per-ip")).toBeNull();
    }

    expect(enforceRateLimit(first, "per-ip")).not.toBeNull();
    expect(enforceRateLimit(second, "per-ip")).toBeNull();
  });

  it("ignores unverified bearer tokens and keys buckets on IP only", () => {
    const token = makeJwt({ sub: "user-abc" });
    const authed = makeRequest({
      headers: {
        authorization: `Bearer ${token}`,
        "x-forwarded-for": "10.0.0.5",
      },
    });
    const sameIpAnonymous = makeRequest({
      headers: { "x-forwarded-for": "10.0.0.5" },
    });

    for (let i = 0; i < 10; i += 1) {
      expect(enforceRateLimit(authed, "per-user")).toBeNull();
    }

    // A JWT sub must not mint a separate bucket: same IP shares the limit.
    expect(enforceRateLimit(authed, "per-user")).not.toBeNull();
    expect(enforceRateLimit(sameIpAnonymous, "per-user")).not.toBeNull();
  });

  it("shares the IP bucket for malformed bearer tokens", () => {
    const malformed = makeRequest({
      headers: {
        authorization: "Bearer not-a-jwt",
        "x-forwarded-for": "10.0.0.6",
      },
    });
    const sameIp = makeRequest({
      headers: { "x-forwarded-for": "10.0.0.6" },
    });

    for (let i = 0; i < 10; i += 1) {
      expect(enforceRateLimit(malformed, "malformed-token")).toBeNull();
    }

    expect(enforceRateLimit(sameIp, "malformed-token")).not.toBeNull();
  });

  it("resets the bucket after the window expires", () => {
    vi.useFakeTimers();
    const request = makeRequest({
      headers: { "x-forwarded-for": "10.0.0.7" },
    });

    for (let i = 0; i < 10; i += 1) {
      expect(enforceRateLimit(request, "window-reset")).toBeNull();
    }
    expect(enforceRateLimit(request, "window-reset")).not.toBeNull();

    vi.advanceTimersByTime(61_000);
    expect(enforceRateLimit(request, "window-reset")).toBeNull();
  });
});

describe("aiFailureResponse", () => {
  it("maps upstream 429 errors to a 503", async () => {
    const response = aiFailureResponse({ status: 429 });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/rate-limiting/);
  });

  it("maps upstream 408 errors to a 504", async () => {
    const response = aiFailureResponse({ status: 408 });

    expect(response.status).toBe(504);
  });

  it("maps timeout-like errors to a 504", async () => {
    expect(aiFailureResponse(new Error("Request timed out")).status).toBe(504);
    expect(aiFailureResponse({ code: "connection_timeout" }).status).toBe(504);
    expect(aiFailureResponse({ name: "TimeoutError" }).status).toBe(504);
  });

  it("maps everything else to a 502", async () => {
    expect(aiFailureResponse(new Error("boom")).status).toBe(502);
    expect(aiFailureResponse(null).status).toBe(502);
    expect(aiFailureResponse("string error").status).toBe(502);
  });
});
