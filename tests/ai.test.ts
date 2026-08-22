import { beforeEach, describe, expect, it, vi } from "vitest";

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class MockOpenAI {
    chat = { completions: { create: createMock } };
  },
}));

import {
  chatToContract,
  computeReputationScore,
  redFlagCheck,
  type Deal,
  type DealSummary,
} from "../lib/ai";

function mockCompletion(content: string | null) {
  createMock.mockResolvedValueOnce({
    choices: [{ message: { content } }],
  });
}

function makeDeal(overrides: Partial<DealSummary> = {}): DealSummary {
  return {
    freelancerName: "Asha",
    clientName: "Ravi",
    scope:
      "Design a 5 page responsive website in Figma with source files delivered as PNG exports",
    price: 15000,
    currency: "INR",
    deadline: "2026-09-15",
    paymentTerms: "50% advance, 50% on delivery",
    revisions: "2 revisions",
    confidence: "high",
    missingFields: [],
    ...overrides,
  };
}

beforeEach(() => {
  createMock.mockReset();
  process.env.GROQ_API_KEY = "test-key";
});

describe("computeReputationScore", () => {
  it("returns zeros for an empty deal history", () => {
    expect(computeReputationScore([])).toEqual({
      score: 0,
      dealCount: 0,
      avgRating: 0,
      onTimePaymentRate: 0,
    });
  });

  it("computes weighted score for a single perfect deal", () => {
    const deals: Deal[] = [
      { status: "completed", wasPaidOnTime: true, rating: 5 },
    ];
    const result = computeReputationScore(deals);

    expect(result.dealCount).toBe(1);
    expect(result.avgRating).toBe(5);
    expect(result.onTimePaymentRate).toBe(1);
    // ratingScore 1 * 0.5 + onTime 1 * 0.3 + log1p(1)/log1p(20) * 0.2
    const expected = Math.round(
      (0.5 + 0.3 + (Math.log1p(1) / Math.log1p(20)) * 0.2) * 100,
    );
    expect(result.score).toBe(expected);
  });

  it("clamps out-of-range and non-finite ratings", () => {
    const deals: Deal[] = [
      { status: "completed", wasPaidOnTime: true, rating: 99 },
      { status: "completed", wasPaidOnTime: false, rating: -3 },
      { status: "completed", wasPaidOnTime: true, rating: Number.NaN },
    ];
    const result = computeReputationScore(deals);

    // 99 -> 5, -3 -> 1, NaN -> 1 => avg (5 + 1 + 1) / 3
    expect(result.avgRating).toBe(2.33);
    expect(result.onTimePaymentRate).toBe(0.67);
  });

  it("caps the deal count contribution for large histories", () => {
    const manyDeals: Deal[] = Array.from({ length: 100 }, () => ({
      status: "completed",
      wasPaidOnTime: true,
      rating: 5,
    }));
    const result = computeReputationScore(manyDeals);

    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBe(100);
  });

  it("gives a low score for poorly rated late-paying history", () => {
    const deals: Deal[] = [
      { status: "completed", wasPaidOnTime: false, rating: 1 },
      { status: "completed", wasPaidOnTime: false, rating: 1 },
    ];
    const result = computeReputationScore(deals);

    expect(result.avgRating).toBe(1);
    expect(result.onTimePaymentRate).toBe(0);
    const expected = Math.round(
      (Math.log1p(2) / Math.log1p(20)) * 0.2 * 100,
    );
    expect(result.score).toBe(expected);
  });
});

describe("chatToContract", () => {
  it("returns a low-confidence empty summary for blank input without calling the model", async () => {
    const result = await chatToContract("   \n  ");

    expect(createMock).not.toHaveBeenCalled();
    expect(result.confidence).toBe("low");
    expect(result.currency).toBe("INR");
    expect(result.missingFields).toEqual([
      "freelancerName",
      "clientName",
      "scope",
      "price",
      "deadline",
      "paymentTerms",
      "revisions",
    ]);
  });

  it("parses a valid model response", async () => {
    mockCompletion(
      JSON.stringify({
        freelancerName: "Asha",
        clientName: "Ravi",
        scope: "Design a landing page",
        price: 5000,
        currency: "INR",
        deadline: "2026-09-01",
        paymentTerms: "Full on delivery",
        revisions: "1 revision",
        confidence: "high",
        missingFields: [],
      }),
    );

    const result = await chatToContract("chat text");

    expect(result.price).toBe(5000);
    expect(result.freelancerName).toBe("Asha");
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("adds null or empty required fields to missingFields", async () => {
    mockCompletion(
      JSON.stringify({
        freelancerName: null,
        clientName: "Ravi",
        scope: "",
        price: null,
        currency: "  ",
        deadline: null,
        paymentTerms: null,
        revisions: null,
        confidence: "low",
        missingFields: ["price"],
      }),
    );

    const result = await chatToContract("chat text");

    expect(result.currency).toBe("INR");
    expect(result.missingFields).toEqual(
      expect.arrayContaining([
        "freelancerName",
        "scope",
        "price",
        "deadline",
        "paymentTerms",
        "revisions",
      ]),
    );
    expect(result.missingFields).not.toContain("clientName");
  });

  it("coerces string prices and comma-separated missingFields", async () => {
    mockCompletion(
      JSON.stringify({
        freelancerName: "Asha",
        clientName: "Ravi",
        scope: "Design a landing page",
        price: "15,000",
        currency: "INR",
        deadline: "2026-09-01",
        paymentTerms: "Advance",
        revisions: "2",
        confidence: "medium",
        missingFields: "deadline, revisions",
      }),
    );

    const result = await chatToContract("chat text");

    expect(result.price).toBe(15000);
    expect(result.missingFields).toEqual(
      expect.arrayContaining(["deadline", "revisions"]),
    );
  });

  it("extracts JSON wrapped in surrounding prose", async () => {
    mockCompletion(
      `Here is the extraction:\n${JSON.stringify({
        freelancerName: "Asha",
        clientName: "Ravi",
        scope: "Edit 3 videos",
        price: 9000,
        currency: "INR",
        deadline: "2026-09-10",
        paymentTerms: "On delivery",
        revisions: "1",
        confidence: "high",
        missingFields: [],
      })}\nLet me know if you need anything else.`,
    );

    const result = await chatToContract("chat text");

    expect(result.scope).toBe("Edit 3 videos");
  });

  it("retries once after an invalid response and succeeds", async () => {
    mockCompletion("not json at all");
    mockCompletion(
      JSON.stringify({
        freelancerName: "Asha",
        clientName: "Ravi",
        scope: "Write 4 blog posts",
        price: 4000,
        currency: "INR",
        deadline: "2026-09-05",
        paymentTerms: "Half upfront",
        revisions: "1",
        confidence: "medium",
        missingFields: [],
      }),
    );

    const result = await chatToContract("chat text");

    expect(createMock).toHaveBeenCalledTimes(2);
    expect(result.price).toBe(4000);
  });

  it("throws when both attempts return invalid JSON", async () => {
    mockCompletion("garbage");
    mockCompletion("still garbage");

    await expect(chatToContract("chat text")).rejects.toThrow(
      /failed validation/,
    );
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("throws when the model returns an empty response", async () => {
    mockCompletion(null);
    mockCompletion(null);

    await expect(chatToContract("chat text")).rejects.toThrow(
      /empty response/,
    );
  });
});

describe("redFlagCheck", () => {
  it("returns no flags for a complete specific deal", async () => {
    const result = await redFlagCheck(makeDeal());

    expect(result).toEqual({ hasRedFlags: false, flags: [] });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("flags missing price, deadline, payment terms, and scope", async () => {
    const result = await redFlagCheck(
      makeDeal({ price: null, deadline: null, paymentTerms: null, scope: "" }),
    );

    expect(result.hasRedFlags).toBe(true);
    expect(result.flags.map((flag) => flag.field).sort()).toEqual([
      "deadline",
      "paymentTerms",
      "price",
      "scope",
    ]);
  });

  it("flags zero and negative prices", async () => {
    const zeroResult = await redFlagCheck(makeDeal({ price: 0 }));
    const negativeResult = await redFlagCheck(makeDeal({ price: -100 }));

    expect(zeroResult.flags.some((flag) => flag.field === "price")).toBe(true);
    expect(negativeResult.flags.some((flag) => flag.field === "price")).toBe(
      true,
    );
  });

  it("flags very short scopes without calling the model", async () => {
    const result = await redFlagCheck(makeDeal({ scope: "make website" }));

    expect(createMock).not.toHaveBeenCalled();
    expect(
      result.flags.some(
        (flag) => flag.field === "scope" && /short/i.test(flag.issue),
      ),
    ).toBe(true);
  });

  it("asks the model when a long scope has no specific signals", async () => {
    mockCompletion(
      JSON.stringify({
        flags: [{ field: "scope", issue: "No concrete outcomes defined." }],
      }),
    );
    const vagueScope =
      "help with some creative work and general improvements to make " +
      "everything look better and feel more professional overall for the client";

    const result = await redFlagCheck(makeDeal({ scope: vagueScope }));

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(result.flags).toEqual([
      { field: "scope", issue: "No concrete outcomes defined." },
    ]);
  });

  it("flags urgent deadlines paired with large scopes", async () => {
    const result = await redFlagCheck(
      makeDeal({
        deadline: "tomorrow",
        scope:
          "Build a complete e-commerce website with backend API and database",
      }),
    );

    expect(
      result.flags.some(
        (flag) => flag.field === "deadline" && /unrealistic/i.test(flag.issue),
      ),
    ).toBe(true);
  });

  it("does not flag urgent deadlines for small scopes", async () => {
    const result = await redFlagCheck(
      makeDeal({
        deadline: "tomorrow",
        scope: "Design one logo in PNG format with two revisions included",
      }),
    );

    expect(result.flags).toEqual([]);
  });
});
