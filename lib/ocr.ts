import Tesseract from 'tesseract.js';
import { OcrError } from './errors';

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface OCRProgress {
  status: string;
  progress: number;
}

export type OCRProgressCallback = (progress: OCRProgress) => void;

let workerPromise: Promise<Tesseract.Worker> | null = null;
let currentProgressCallback: OCRProgressCallback | undefined;

function getWorker(): Promise<Tesseract.Worker> {
  workerPromise ??= Tesseract.createWorker('eng', undefined, {
    logger: (message: Tesseract.LoggerMessage) => {
      if (!currentProgressCallback) {
        return;
      }

      if (message.status === 'recognizing text') {
        currentProgressCallback({
          status: message.status,
          progress: message.progress * 100,
        });
      } else {
        currentProgressCallback({
          status: message.status,
          progress: 0,
        });
      }
    },
    // Tesseract reports worker-level failures here; without a handler they are
    // only logged inside the worker.
    errorHandler: (workerError: unknown) => {
      console.error('Tesseract worker error:', workerError);
    },
  });

  return workerPromise;
}

/**
 * Extract text from an image using Tesseract.js OCR
 * @param image - Browser File/Blob, or a Buffer/path for headless (Node) use
 * @param onProgress - Optional callback for progress updates
 * @returns Promise with extracted text and confidence score
 * @throws OcrError when recognition fails or the image contains no text
 */
export async function extractTextFromImage(
  image: File | Blob | Buffer | string,
  onProgress?: OCRProgressCallback
): Promise<OCRResult> {
  const usesObjectUrl = typeof Blob !== 'undefined' && image instanceof Blob;
  const imageUrl = usesObjectUrl ? URL.createObjectURL(image as Blob) : null;
  currentProgressCallback = onProgress;

  try {
    const worker = await getWorker();
    const result = await worker.recognize(imageUrl ?? image);

    const confidence = result.data.confidence;
    const text = result.data.text?.trim() ?? '';

    if (!text) {
      throw new OcrError('No readable text was found in the image.');
    }

    return { text, confidence };
  } catch (error) {
    if (error instanceof OcrError) {
      throw error;
    }

    // Keep the original failure as `cause` so callers can log the real reason
    // while showing the user-facing message.
    throw new OcrError(
      'Failed to extract text from image. Please try again or use manual text input.',
      { cause: error }
    );
  } finally {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    currentProgressCallback = undefined;
  }
}

/**
 * Check if OCR confidence is low enough to warrant a warning
 * @param confidence - Confidence score from OCR (0-100)
 * @returns true if confidence is low (< 60)
 */
export function isLowConfidence(confidence: number): boolean {
  return confidence < 60;
}

/**
 * Get a user-friendly message based on confidence level
 * @param confidence - Confidence score from OCR (0-100)
 * @returns Appropriate warning message
 */
export function getConfidenceMessage(confidence: number): string {
  if (confidence >= 80) {
    return 'Text quality is good';
  } else if (confidence >= 60) {
    return 'Text quality is acceptable, but please double-check important numbers';
  } else {
    return 'Text quality was low, please carefully review the extracted text especially numbers and prices';
  }
}