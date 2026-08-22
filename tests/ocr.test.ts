import { beforeEach, describe, expect, it, vi } from "vitest";

const { recognizeMock } = vi.hoisted(() => ({
  recognizeMock: vi.fn(),
}));

vi.mock("tesseract.js", () => ({
  default: { recognize: recognizeMock },
}));

import {
  extractTextFromImage,
  getConfidenceMessage,
  isLowConfidence,
} from "../lib/ocr";

function makeFile(): File {
  return new File(["fake image bytes"], "screenshot.png", {
    type: "image/png",
  });
}

beforeEach(() => {
  recognizeMock.mockReset();
});

describe("isLowConfidence", () => {
  it("returns true below the 60 threshold", () => {
    expect(isLowConfidence(0)).toBe(true);
    expect(isLowConfidence(59.9)).toBe(true);
  });

  it("returns false at or above the threshold", () => {
    expect(isLowConfidence(60)).toBe(false);
    expect(isLowConfidence(100)).toBe(false);
  });
});

describe("getConfidenceMessage", () => {
  it("reports good quality at 80 and above", () => {
    expect(getConfidenceMessage(80)).toBe("Text quality is good");
    expect(getConfidenceMessage(95)).toBe("Text quality is good");
  });

  it("reports acceptable quality between 60 and 79", () => {
    expect(getConfidenceMessage(60)).toMatch(/acceptable/);
    expect(getConfidenceMessage(79)).toMatch(/acceptable/);
  });

  it("warns about low quality below 60", () => {
    expect(getConfidenceMessage(59)).toMatch(/low/);
    expect(getConfidenceMessage(0)).toMatch(/low/);
  });
});

describe("extractTextFromImage", () => {
  it("returns trimmed text and confidence from Tesseract", async () => {
    recognizeMock.mockResolvedValueOnce({
      data: { text: "  Extracted contract text  \n", confidence: 87 },
    });

    const result = await extractTextFromImage(makeFile());

    expect(result).toEqual({
      text: "Extracted contract text",
      confidence: 87,
    });
    expect(recognizeMock).toHaveBeenCalledTimes(1);
    expect(recognizeMock).toHaveBeenCalledWith(
      expect.stringContaining("blob:"),
      "eng",
      expect.objectContaining({ logger: expect.any(Function) }),
    );
  });

  it("forwards recognition progress as a percentage", async () => {
    recognizeMock.mockImplementationOnce(async (_image, _lang, options) => {
      options.logger({ status: "loading tesseract core", progress: 0.5 });
      options.logger({ status: "recognizing text", progress: 0.25 });
      options.logger({ status: "recognizing text", progress: 1 });
      return { data: { text: "done", confidence: 90 } };
    });

    const updates: { status: string; progress: number }[] = [];
    await extractTextFromImage(makeFile(), (progress) => updates.push(progress));

    expect(updates).toEqual([
      { status: "loading tesseract core", progress: 0 },
      { status: "recognizing text", progress: 25 },
      { status: "recognizing text", progress: 100 },
    ]);
  });

  it("wraps Tesseract failures in a user-friendly error", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    recognizeMock.mockRejectedValueOnce(new Error("worker crashed"));

    await expect(extractTextFromImage(makeFile())).rejects.toThrow(
      /Failed to extract text from image/,
    );

    consoleSpy.mockRestore();
  });
});
