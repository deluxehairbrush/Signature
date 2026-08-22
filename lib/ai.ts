import OpenAI from "openai";
import { z } from "zod";
import { AiConfigError, AiResponseError, describeError } from "./errors";

const MODEL = "llama-3.3-70b-versatile";
let groq: OpenAI | null = null;

const confidenceSchema = z.enum(["high", "medium", "low"]);

export const dealSummarySchema = z.object({
  freelancerName: z.string().nullable(),
  clientName: z.string().nullable(),
  scope: z.preprocess((value) => value ?? "", z.string()),
  price: z.number().nullable(),
  currency: z.preprocess((value) => value ?? "INR", z.string()),
  deadline: z.string().nullable(),
  paymentTerms: z.string().nullable(),
  revisions: z.string().nullable(),
  confidence: confidenceSchema,
  missingFields: z.array(z.string()),
});

export type DealSummary = z.infer<typeof dealSummarySchema>;

export type RedFlagResult = {
  hasRedFlags: boolean;
  flags: { field: string; issue: string }[];
  /**
   * True when the deterministic checks ran but the optional AI scope review
   * could not complete, so the flag list may be incomplete.
   */
  scopeReviewUnavailable: boolean;
};

export type Deal = {
  status: string;
  wasPaidOnTime: boolean;
  rating: number;
};

export type ReputationScore = {
  score: number;
  dealCount: number;
  avgRating: number;
  onTimePaymentRate: number;
};

const redFlagSchema = z.object({
  flags: z.array(
    z.object({
      field: z.string(),
      issue: z.string(),
    }),
  ),
});

const requiredDealFields: Array<keyof Omit<DealSummary, "confidence" | "missingFields">> = [
  "freelancerName",
  "clientName",
  "scope",
  "price",
  "deadline",
  "paymentTerms",
  "revisions",
];

// Keep prompt wording here so teammates can tune extraction behavior without
// hunting through call sites. The model must preserve uncertainty instead of
// inventing contract details.
const contractExtractionPrompt = `
You are extracting a freelance work agreement from an informal chat conversation.
The conversation may be in English, Hinglish, or a mix. It may span multiple
messages from both parties.

Extract ONLY what is explicitly stated or very strongly implied. Do not invent
prices, dates, or names. If something is unclear or missing, list it in
missingFields instead of guessing.

Return ONLY valid JSON matching this schema, no prose before or after:
{
  "freelancerName": string | null,
  "clientName": string | null,
  "scope": string,
  "price": number | null,
  "currency": string,
  "deadline": string | null,
  "paymentTerms": string | null,
  "revisions": string | null,
  "confidence": "high" | "medium" | "low",
  "missingFields": string[]
}

Rules:
- Use null for any field that is not clearly present.
- Use an empty string for scope if the work itself is unclear, and include
  "scope" in missingFields.
- Put every missing or unclear field name in missingFields.
- Do not hallucinate names, prices, dates, payment terms, or revision counts.
- Write scope as a 1-2 sentence plain description of the work.
- Normalize price to a number only when the amount is explicit.
- If multiple prices are discussed, extract the final agreed price only. Prefer
  the latest amount that both sides accept using phrases like "done", "ok",
  "final", "deal", "works", "confirmed", "theek hai", "chalega", or "haan".
- Do not treat phone numbers, OTPs, dates, times, quantities, page counts,
  revision counts, ratings, or percentages as price unless the amount is clearly
  connected to money or payment.
- If there is an opening offer or counteroffer but no clear acceptance, use
  price null and include "price" in missingFields.
- Use the explicit currency symbol/code/name from the chat. If no currency is
  specified, default currency to "INR" and do not mark currency as missing.
- Convert deadline to an ISO date when determinable from the conversation;
  otherwise use null and include "deadline" in missingFields.
- Keep paymentTerms as concise text from the conversation.
- If payment is deferred with phrases like "we will decide later", "discuss
  later", "TBD", or "baad mein decide karenge", paymentTerms is missing: use
  null and include "paymentTerms" in missingFields.
- Confidence is high only when most required fields are explicit, medium when
  some fields require light interpretation, and low when many fields are absent.
`;

// Used only when deterministic checks cannot confidently decide whether a scope
// is vague. This keeps redFlagCheck cheap for obvious cases.
const vagueScopePrompt = `
Decide whether this freelancer deal scope is too vague to be enforceable.

Return only valid JSON:
{
  "flags": [{ "field": "scope", "issue": string }]
}

Return an empty flags array if the scope is specific enough.
Flag vague scopes that lack deliverables, quantity, platform, format, or clear
success criteria.
`;

export async function chatToContract(rawText: string): Promise<DealSummary> {
  const trimmedText = rawText.trim();

  if (!trimmedText) {
    return dealSummarySchema.parse({
      freelancerName: null,
      clientName: null,
      scope: "",
      price: null,
      currency: "INR",
      deadline: null,
      paymentTerms: null,
      revisions: null,
      confidence: "low",
      missingFields: requiredDealFields,
    });
  }

  const summary = await callJsonWithRetry({
    schema: dealSummarySchema,
    systemPrompt: contractExtractionPrompt,
    userPrompt: `Conversation:\n"""\n${trimmedText}\n"""`,
  });

  return normalizeMissingFields(summary);
}

export async function redFlagCheck(deal: DealSummary): Promise<RedFlagResult> {
  const flags: RedFlagResult["flags"] = [];
  let scopeReviewUnavailable = false;

  if (deal.price == null || !Number.isFinite(deal.price) || deal.price <= 0) {
    flags.push({ field: "price", issue: "Missing or invalid price." });
  }

  if (!hasText(deal.deadline)) {
    flags.push({ field: "deadline", issue: "Missing deadline." });
  }

  if (!hasText(deal.paymentTerms)) {
    flags.push({ field: "paymentTerms", issue: "No payment terms specified." });
  }

  if (!hasText(deal.scope)) {
    flags.push({ field: "scope", issue: "Missing scope of work." });
  } else if (wordCount(deal.scope) < 10) {
    flags.push({
      field: "scope",
      issue: "Scope is very short and may be too vague.",
    });
  } else if (needsVagueScopeJudgment(deal.scope)) {
    // The AI scope review only adds an extra flag, so a provider failure must
    // not discard the deterministic flags already collected. Report the gap
    // through scopeReviewUnavailable instead of dropping it.
    try {
      const scopeResult = await callJsonWithRetry({
        schema: redFlagSchema,
        systemPrompt: vagueScopePrompt,
        userPrompt: `Scope:\n${deal.scope}`,
      });
      flags.push(...scopeResult.flags);
    } catch (error) {
      console.error("AI scope review failed, returning deterministic flags only", error);
      scopeReviewUnavailable = true;
    }
  }

  if (
    hasText(deal.deadline) &&
    hasText(deal.scope) &&
    isLikelyUnrealisticDeadline(deal.deadline, deal.scope)
  ) {
    flags.push({
      field: "deadline",
      issue: "Deadline may be unrealistic for the described scope.",
    });
  }

  return {
    hasRedFlags: flags.length > 0,
    flags,
    scopeReviewUnavailable,
  };
}

export function computeReputationScore(deals: Deal[]): ReputationScore {
  const completedDeals = deals.filter((deal) => deal.status === "completed");
  const dealCount = completedDeals.length;

  if (dealCount === 0) {
    return {
      score: 0,
      dealCount: 0,
      avgRating: 0,
      onTimePaymentRate: 0,
    };
  }

  const ratedDeals = completedDeals.filter((deal) => hasRating(deal.rating));
  const avgRating =
    ratedDeals.length > 0
      ? clamp(
          ratedDeals.reduce((sum, deal) => sum + normalizeRating(deal.rating), 0) /
            ratedDeals.length,
          1,
          5,
        )
      : 0;
  const onTimePaymentRate =
    completedDeals.filter((deal) => deal.wasPaidOnTime).length / dealCount;

  // Log scaling gives early completed deals meaningful lift while preventing
  // large histories from dominating rating and payment behavior.
  const dealCountScore = clamp(Math.log1p(dealCount) / Math.log1p(20), 0, 1);
  const ratingScore = ratedDeals.length > 0 ? (avgRating - 1) / 4 : 0;
  const combinedScore =
    ratingScore * 0.5 + onTimePaymentRate * 0.3 + dealCountScore * 0.2;

  return {
    score: Math.round(clamp(combinedScore, 0, 1) * 100),
    dealCount,
    avgRating: roundTo(avgRating, 2),
    onTimePaymentRate: roundTo(onTimePaymentRate, 2),
  };
}

async function callJsonWithRetry<T>({
  schema,
  systemPrompt,
  userPrompt,
}: {
  schema: z.ZodType<T>;
  systemPrompt: string;
  userPrompt: string;
}): Promise<T> {
  const firstResponse = await requestJson(systemPrompt, userPrompt);
  const firstParse = parseAndValidateJson(firstResponse, schema);

  if (firstParse.success === true) {
    return firstParse.data;
  }

  const firstError = firstParse.error;
  const retryResponse = await requestJson(
    `${systemPrompt}\n\nYour previous response failed validation. Return corrected JSON only.`,
    `Original request:\n${userPrompt}\n\nInvalid response:\n${firstResponse}\n\nValidation error:\n${firstError}`,
  );
  const retryParse = parseAndValidateJson(retryResponse, schema);

  if (retryParse.success === true) {
    return retryParse.data;
  }

  // Keep both attempts in the message and the last underlying failure as
  // `cause` so the server log explains why the response was rejected.
  throw new AiResponseError(
    `Groq JSON response failed validation twice. First attempt: ${firstError}. Retry: ${retryParse.error}`,
    { cause: retryParse.cause },
  );
}

async function requestJson(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await getGroqClient().chat.completions.create({
    model: process.env.GROQ_MODEL?.trim() || MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const choice = response.choices[0];
  const content = choice?.message?.content;

  if (!content) {
    throw new AiResponseError(
      `Groq returned an empty response (finish_reason: ${choice?.finish_reason ?? "none"}).`,
    );
  }

  return content;
}

function getGroqClient(): OpenAI {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new AiConfigError("Missing GROQ_API_KEY environment variable.");
  }

  groq ??= new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
    timeout: 20_000,
  });

  return groq;
}

function normalizeMissingFields(summary: DealSummary): DealSummary {
  const normalizedCurrency = summary.currency.trim() || "INR";
  const missingFields = requiredDealFields.filter((field) => {
    const value = summary[field];
    return value == null || (typeof value === "string" && value.trim() === "");
  });

  return {
    ...summary,
    currency: normalizedCurrency,
    missingFields,
  };
}

function parseAndValidateJson<T>(
  content: string,
  schema: z.ZodType<T>,
):
  | { success: true; data: T }
  | { success: false; error: string; cause?: unknown } {
  try {
    const parsed = normalizeJsonCandidate(JSON.parse(extractJsonObject(content)));
    const validation = schema.safeParse(parsed);

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.message,
        cause: validation.error,
      };
    }

    return { success: true, data: validation.data };
  } catch (error) {
    return { success: false, error: describeError(error), cause: error };
  }
}

function normalizeJsonCandidate(candidate: unknown): unknown {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return candidate;
  }

  const normalized = { ...candidate } as Record<string, unknown>;

  if (typeof normalized.price === "string") {
    const priceText = normalized.price.replace(/,/g, "").trim();
    normalized.price = priceText === "" ? null : Number(priceText);
  }

  if (typeof normalized.missingFields === "string") {
    normalized.missingFields = normalized.missingFields
      .split(",")
      .map((field) => field.trim())
      .filter(Boolean);
  } else if (!Array.isArray(normalized.missingFields)) {
    normalized.missingFields = [];
  }

  return normalized;
}

function extractJsonObject(content: string): string {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in model response.");
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}

function hasText(value: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function needsVagueScopeJudgment(scope: string): boolean {
  const lowerScope = scope.toLowerCase();
  const hasSpecificSignal = [
    /\b\d+\b/,
    /\b(page|pages|screen|screens|logo|logos|post|posts|video|videos)\b/,
    /\b(deliver|delivery|figma|website|app|landing|dashboard|api|brand|copy)\b/,
    /\b(format|png|jpg|pdf|docx|source file|responsive|revision)\b/,
  ].some((pattern) => pattern.test(lowerScope));

  return !hasSpecificSignal;
}

function isLikelyUnrealisticDeadline(deadline: string, scope: string): boolean {
  const lowerDeadline = deadline.toLowerCase();
  const lowerScope = scope.toLowerCase();
  const urgentDeadline =
    /\b(today|tonight|tomorrow|overnight|24\s*hours?|1\s*day|one\s*day)\b/.test(
      lowerDeadline,
    );

  if (!urgentDeadline) {
    return false;
  }

  const largeScopeSignal =
    wordCount(scope) >= 35 ||
    /\b(full|complete|entire|complex|dashboard|marketplace|mobile app|web app|e-?commerce|backend|api|database|branding package|brand identity)\b/.test(
      lowerScope,
    ) ||
    /\b\d+\s*(pages|screens|videos|posts|deliverables)\b/.test(lowerScope);

  return largeScopeSignal;
}

function hasRating(rating: number): boolean {
  return Number.isFinite(rating) && rating > 0;
}

function normalizeRating(rating: number): number {
  return Number.isFinite(rating) ? clamp(rating, 1, 5) : 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundTo(value: number, decimals: number): number {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}
