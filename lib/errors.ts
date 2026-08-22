/**
 * Error types shared by the AI, OCR, and API layers.
 *
 * Every layer that fails should throw one of these (or rethrow with `cause`
 * set) so callers can map a failure to the right status code and message
 * instead of guessing from a generic `Error`.
 */

/** The AI provider is not usable because of server configuration. */
export class AiConfigError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AiConfigError";
  }
}

/** The AI provider replied, but the response could not be used. */
export class AiResponseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AiResponseError";
  }
}

/** Text extraction from an image failed. */
export class OcrError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "OcrError";
  }
}

export function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
