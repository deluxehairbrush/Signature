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

/**
 * Extract text from an image file using Tesseract.js OCR
 * @param file - Image file to process
 * @param onProgress - Optional callback for progress updates
 * @returns Promise with extracted text and confidence score
 * @throws OcrError when recognition fails or the image contains no text
 */
export async function extractTextFromImage(
  file: File,
  onProgress?: OCRProgressCallback
): Promise<OCRResult> {
  // Convert file to appropriate format for Tesseract
  const imageUrl = URL.createObjectURL(file);

  try {
    // Perform OCR with progress tracking
    const result = await Tesseract.recognize(
      imageUrl,
      'eng', // English language - can add more languages if needed
      {
        logger: (message: Tesseract.LoggerMessage) => {
          if (!onProgress) {
            return;
          }

          onProgress({
            status: message.status,
            progress: message.status === 'recognizing text' ? message.progress * 100 : 0,
          });
        },
        // Tesseract reports worker-level failures here; without a handler they
        // are only logged inside the worker and the promise can hang.
        errorHandler: (workerError: unknown) => {
          console.error('Tesseract worker error:', workerError);
        },
      }
    );

    const text = result.data.text?.trim() ?? '';

    if (!text) {
      throw new OcrError('No readable text was found in the image.');
    }

    return {
      text,
      confidence: result.data.confidence,
    };
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
    // Always release the object URL, including on the failure path.
    URL.revokeObjectURL(imageUrl);
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