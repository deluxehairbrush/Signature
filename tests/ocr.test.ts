import { beforeEach, describe, expect, it, vi } from "vitest";

const { recognizeMock, createWorkerMock, loggerRef } = vi.hoisted(() => {
  const state: {
    recognizeMock: ReturnType<typeof vi.fn>;
    createWorkerMock: ReturnType<typeof vi.fn>;
    loggerRef: { current: ((message: unknown) => void) | null };
  } = {
    recognizeMock: vi.fn(),
    createWorkerMock: vi.fn(),
    loggerRef: { current: null },
  };

  state.createWorkerMock.mockImplementation(
    async (_lang: string, _oem: unknown, options: { logger: (message: unknown) => void }) => {
      state.loggerRef.current = options.logger;
      return { recognize: state.recognizeMock };
    },
  );

  return state;
});

vi.mock("tesseract.js", () => ({
  default: { createWorker: createWorkerMock },
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
  it("returns trimmed text and confidence for a browser File via an object URL", async () => {
    recognizeMock.mockResolvedValueOnce({
      data: { text: "  Extracted contract text  \n", confidence: 87 },
    });

    const result = await extractTextFromImage(makeFile());

    expect(result).toEqual({
      text: "Extracted contract text",
      confidence: 87,
    });
    expect(recognizeMock).toHaveBeenCalledWith(
      expect.stringContaining("blob:"),
    );
  });

  it("passes non-Blob input (e.g. a file path) straight to the worker", async () => {
    recognizeMock.mockResolvedValueOnce({
      data: { text: "headless text", confidence: 91 },
    });

    const result = await extractTextFromImage("/tmp/screenshot.png");

    expect(result.text).toBe("headless text");
    expect(recognizeMock).toHaveBeenCalledWith("/tmp/screenshot.png");
  });

  it("reuses a single Tesseract worker across calls", async () => {
    recognizeMock.mockResolvedValue({
      data: { text: "one", confidence: 90 },
    });

    await extractTextFromImage(makeFile());
    await extractTextFromImage(makeFile());

    expect(createWorkerMock).toHaveBeenCalledTimes(1);
  });

  it("forwards recognition progress as a percentage", async () => {
    recognizeMock.mockImplementationOnce(async () => {
      loggerRef.current?.({ status: "loading tesseract core", progress: 0.5 });
      loggerRef.current?.({ status: "recognizing text", progress: 0.25 });
      loggerRef.current?.({ status: "recognizing text", progress: 1 });
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

  it("does not report progress after a call without a callback", async () => {
    recognizeMock.mockImplementationOnce(async () => {
      loggerRef.current?.({ status: "recognizing text", progress: 0.5 });
      return { data: { text: "quiet", confidence: 90 } };
    });

    const updates: unknown[] = [];
    await extractTextFromImage(makeFile());

    expect(updates).toEqual([]);
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
