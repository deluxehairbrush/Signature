import { NextRequest } from "next/server";
import { z } from "zod";
import { dealSummarySchema, redFlagCheck } from "../../../../lib/ai";
import { handleAiRequest } from "../../../../lib/ai-api";

export const runtime = "nodejs";

const redFlagsBodySchema = z.object({
  deal: dealSummarySchema,
});

export async function POST(request: NextRequest) {
  return handleAiRequest(request, {
    schema: redFlagsBodySchema,
    errorLogMessage: "Failed to check deal red flags with AI",
    handler: async ({ deal }) => ({ result: await redFlagCheck(deal) }),
  });
}
