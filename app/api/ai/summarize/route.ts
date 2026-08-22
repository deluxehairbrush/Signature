import { NextRequest } from "next/server";
import { z } from "zod";
import { chatToContract } from "../../../../lib/ai";
import { handleAiRequest } from "../../../../lib/ai-api";

export const runtime = "nodejs";

const summarizeBodySchema = z.object({
  rawText: z.string().min(1, "rawText is required."),
});

export async function POST(request: NextRequest) {
  return handleAiRequest(request, {
    schema: summarizeBodySchema,
    rateLimitAction: "summarize",
    errorLogMessage: "Failed to summarize chat with AI",
    handler: async ({ rawText }) => ({ deal: await chatToContract(rawText) }),
  });
}
