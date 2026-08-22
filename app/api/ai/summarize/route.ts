import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chatToContract } from "../../../../lib/ai";
import {
  aiFailureResponse,
  enforceRateLimit,
  parseJsonBody,
} from "../../../../lib/ai-api";

export const runtime = "nodejs";

const summarizeBodySchema = z.object({
  rawText: z
    .string()
    .min(1, "rawText is required.")
    .max(20_000, "rawText must be 20,000 characters or fewer."),
});

export async function POST(request: NextRequest) {
  const rateLimitResponse = enforceRateLimit(request, "summarize");

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const body = await parseJsonBody(request, summarizeBodySchema);

  if (body.success === false) {
    return body.response;
  }

  try {
    const deal = await chatToContract(body.data.rawText);
    return NextResponse.json({ ok: true, deal });
  } catch (error) {
    console.error("Failed to summarize chat with AI", error);
    return aiFailureResponse(error);
  }
}
