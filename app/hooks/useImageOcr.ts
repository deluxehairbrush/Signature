'use client';

import { useCallback, useRef, useState } from 'react';
import { extractTextFromImage } from '../../lib/ocr';

type UseImageOcrOptions = {
  /** Message shown when OCR throws. */
  failureMessage?: string;
};

/**
 * Owns the screenshot -> OCR text flow: file picking (click, paste, drop),
 * preview generation, progress reporting and the editable extracted text.
 */
export function useImageOcr({
  failureMessage = 'Failed to extract text from image. Please try again or use manual text input.',
}: UseImageOcrOptions = {}) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      setIsProcessing(true);
      setOcrProgress(0);
      setOcrStatus('Initializing...');
      setOcrText('');

      try {
        const result = await extractTextFromImage(file, (progress) => {
          setOcrProgress(progress.progress);
          setOcrStatus(progress.status);
        });

        setOcrText(result.text);
        setOcrConfidence(result.confidence);
      } catch (error) {
        console.error('OCR failed:', error);
        alert(failureMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [failureMessage],
  );

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      const items = event.clipboardData?.items;

      if (!items) {
        return;
      }

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          event.preventDefault();
          const file = item.getAsFile();

          if (file) {
            handleFileSelect(file);
          }

          break;
        }
      }
    },
    [handleFileSelect],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer?.files[0];

      if (file && file.type.startsWith('image/')) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const reset = useCallback(() => {
    setOcrText('');
    setOcrConfidence(0);
    setPreviewImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return {
    previewImage,
    ocrText,
    setOcrText,
    ocrConfidence,
    isProcessing,
    ocrProgress,
    ocrStatus,
    fileInputRef,
    handleFileInputChange,
    handlePaste,
    handleDrop,
    handleDragOver,
    reset,
  };
}

export type ImageOcrState = ReturnType<typeof useImageOcr>;
