import Tesseract from 'tesseract.js';

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
 */
export async function extractTextFromImage(
  file: File,
  onProgress?: OCRProgressCallback
): Promise<OCRResult> {
  try {
    // Convert file to appropriate format for Tesseract
    const imageUrl = URL.createObjectURL(file);

    // Perform OCR with progress tracking
    const result = await Tesseract.recognize(
      imageUrl,
      'eng', // English language - can add more languages if needed
      {
        logger: (message: any) => {
          if (onProgress && message.status === 'recognizing text') {
            onProgress({
              status: message.status,
              progress: message.progress * 100,
            });
          } else if (onProgress) {
            onProgress({
              status: message.status,
              progress: 0,
            });
          }
        },
      }
    );

    // Clean up the object URL
    URL.revokeObjectURL(imageUrl);

    // Extract confidence and text
    const confidence = result.data.confidence;
    const text = result.data.text.trim();

    return {
      text,
      confidence,
    };
  } catch (error) {
    console.error('OCR extraction failed:', error);
    throw new Error('Failed to extract text from image. Please try again or use manual text input.');
  }
}

export const CONFIDENCE_GOOD_THRESHOLD = 80;
export const CONFIDENCE_ACCEPTABLE_THRESHOLD = 60;

export type ConfidenceLevel = 'good' | 'acceptable' | 'low';

/**
 * Bucket a raw OCR confidence score (0-100) into a qualitative level
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= CONFIDENCE_GOOD_THRESHOLD) {
    return 'good';
  }

  if (confidence >= CONFIDENCE_ACCEPTABLE_THRESHOLD) {
    return 'acceptable';
  }

  return 'low';
}

/**
 * Check if OCR confidence is low enough to warrant a warning
 * @param confidence - Confidence score from OCR (0-100)
 * @returns true if confidence is low (< 60)
 */
export function isLowConfidence(confidence: number): boolean {
  return getConfidenceLevel(confidence) === 'low';
}

/**
 * Get a user-friendly message based on confidence level
 * @param confidence - Confidence score from OCR (0-100)
 * @returns Appropriate warning message
 */
export function getConfidenceMessage(confidence: number): string {
  switch (getConfidenceLevel(confidence)) {
    case 'good':
      return 'Text quality is good';
    case 'acceptable':
      return 'Text quality is acceptable, but please double-check important numbers';
    case 'low':
      return 'Text quality was low, please carefully review the extracted text especially numbers and prices';
  }
}