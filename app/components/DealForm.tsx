'use client';

import { useState } from 'react';
import { isLowConfidence } from '../../lib/ocr';
import { useImageOcr } from '../hooks/useImageOcr';
import ConfidenceScore from './ocr/ConfidenceScore';
import ImageDropZone from './ocr/ImageDropZone';
import ImagePreview from './ocr/ImagePreview';
import LowConfidenceWarning from './ocr/LowConfidenceWarning';
import OcrProgressBar from './ocr/OcrProgressBar';
import {
  card,
  cardTitle,
  colors,
  fieldLabel,
  primaryButton,
  textArea,
  toggleButton,
} from '../ui/theme';

interface DealFormProps {
  onSubmit: (rawText: string) => Promise<void>;
  isLoading?: boolean;
}

type InputMode = 'text' | 'image';

export default function DealForm({ onSubmit, isLoading = false }: DealFormProps) {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [rawText, setRawText] = useState('');
  const ocr = useImageOcr();

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rawText.trim()) {
      await onSubmit(rawText);
    }
  };

  const handleOCRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ocr.ocrText.trim()) {
      await onSubmit(ocr.ocrText);
    }
  };

  const textSubmitDisabled = isLoading || !rawText.trim();
  const ocrSubmitDisabled = isLoading || !ocr.ocrText.trim();

  return (
    <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '1.5rem' }}>
      <div style={card}>
        <h2 style={{ ...cardTitle, marginBottom: '1.5rem' }}>Create Deal from Chat</h2>

        {/* Input Mode Toggle */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => {
              setInputMode('text');
              ocr.reset();
            }}
            style={toggleButton(inputMode === 'text')}
          >
            Paste Chat Text
          </button>
          <button
            type="button"
            onClick={() => {
              setInputMode('image');
              setRawText('');
            }}
            style={toggleButton(inputMode === 'image')}
          >
            Upload Screenshot
          </button>
        </div>

        {/* Text Input Mode */}
        {inputMode === 'text' && (
          <form onSubmit={handleTextSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="chatText" style={fieldLabel}>
                Chat Conversation
              </label>
              <textarea
                id="chatText"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste your chat conversation here..."
                style={textArea}
                disabled={isLoading}
              />
            </div>
            <button type="submit" disabled={textSubmitDisabled} style={primaryButton(textSubmitDisabled)}>
              {isLoading ? 'Processing...' : 'Generate Contract Summary'}
            </button>
          </form>
        )}

        {/* Image Input Mode */}
        {inputMode === 'image' && (
          <form onSubmit={handleOCRSubmit}>
            {!ocr.previewImage && (
              <ImageDropZone
                fileInputRef={ocr.fileInputRef}
                onFileInputChange={ocr.handleFileInputChange}
                onPaste={ocr.handlePaste}
                onDrop={ocr.handleDrop}
                onDragOver={ocr.handleDragOver}
                title="Upload a screenshot"
                hint="Supports WhatsApp screenshots and other chat images"
              />
            )}

            {ocr.previewImage && (
              <ImagePreview
                src={ocr.previewImage}
                alt="Uploaded screenshot"
                onRemove={ocr.reset}
              />
            )}

            {ocr.isProcessing && (
              <OcrProgressBar status={ocr.ocrStatus} progress={ocr.ocrProgress} />
            )}

            {/* OCR Result */}
            {ocr.ocrText && !ocr.isProcessing && (
              <div style={{ marginBottom: '1rem' }}>
                {isLowConfidence(ocr.ocrConfidence) && (
                  <LowConfidenceWarning confidence={ocr.ocrConfidence} />
                )}

                <ConfidenceScore confidence={ocr.ocrConfidence} />

                <label htmlFor="ocrText" style={fieldLabel}>
                  Extracted Text (editable)
                </label>
                <textarea
                  id="ocrText"
                  value={ocr.ocrText}
                  onChange={(e) => ocr.setOcrText(e.target.value)}
                  style={textArea}
                  disabled={isLoading}
                />
                <p style={{ fontSize: '0.75rem', color: colors.muted, marginTop: '0.25rem' }}>
                  Please review and correct any errors, especially numbers and prices
                </p>
              </div>
            )}

            {/* Submit Button */}
            {ocr.ocrText && !ocr.isProcessing && (
              <button type="submit" disabled={ocrSubmitDisabled} style={primaryButton(ocrSubmitDisabled)}>
                {isLoading ? 'Processing...' : 'Generate Contract Summary'}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
