import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dealSummarySchema, redFlagCheck } from "../../../../lib/ai";
import {
  aiFailureResponse,
  enforceRateLimit,
  parseJsonBody,
} from "../../../../lib/ai-api";

export const runtime = "nodejs";

const redFlagsBodySchema = z.object({
  deal: dealSummarySchema,
});

export async function POST(request: NextRequest) {
  const rateLimitResponse = enforceRateLimit(request, "redflags");

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const body = await parseJsonBody(request, redFlagsBodySchema);

  if (body.success === false) {
    return body.response;
  }

  try {
    const result = await redFlagCheck(body.data.deal);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("Failed to check deal red flags with AI", error);
    return aiFailureResponse(error);
  }
}
