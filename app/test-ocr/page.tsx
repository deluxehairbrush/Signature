'use client';

import { getConfidenceMessage, isLowConfidence } from '../../lib/ocr';
import ConfidenceScore from '../components/ocr/ConfidenceScore';
import ImageDropZone from '../components/ocr/ImageDropZone';
import ImagePreview from '../components/ocr/ImagePreview';
import LowConfidenceWarning from '../components/ocr/LowConfidenceWarning';
import OcrProgressBar from '../components/ocr/OcrProgressBar';
import { useImageOcr } from '../hooks/useImageOcr';
import {
  card,
  colors,
  pageContainer,
  pageHeader,
  pageShell,
  pageSubtitle,
  pageTitle,
  textArea,
} from '../ui/theme';

export default function TestOCR() {
  const ocr = useImageOcr({ failureMessage: 'Failed to extract text from image.' });

  return (
    <div style={pageShell}>
      <div style={pageContainer}>
        <div style={pageHeader}>
          <h1 style={pageTitle}>OCR Test Page</h1>
          <p style={pageSubtitle}>Test text extraction from screenshots</p>
        </div>

        <div style={card}>
          {!ocr.previewImage && (
            <ImageDropZone
              fileInputRef={ocr.fileInputRef}
              onFileInputChange={ocr.handleFileInputChange}
              onPaste={ocr.handlePaste}
              onDrop={ocr.handleDrop}
              onDragOver={ocr.handleDragOver}
              title="Upload a screenshot to test OCR"
              hint="Test with WhatsApp screenshots (light and dark mode)"
            />
          )}

          {ocr.previewImage && (
            <ImagePreview src={ocr.previewImage} alt="Test image" onRemove={ocr.reset} />
          )}

          {ocr.isProcessing && (
            <OcrProgressBar status={ocr.ocrStatus} progress={ocr.ocrProgress} />
          )}

          {/* OCR Result */}
          {ocr.ocrText && !ocr.isProcessing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ConfidenceScore confidence={ocr.ocrConfidence} variant="panel" />

              {isLowConfidence(ocr.ocrConfidence) && (
                <LowConfidenceWarning confidence={ocr.ocrConfidence} />
              )}

              <div>
                <h3 style={{ fontWeight: '500', color: colors.label, marginBottom: '0.5rem' }}>
                  Extracted Text
                </h3>
                <textarea
                  value={ocr.ocrText}
                  onChange={(e) => ocr.setOcrText(e.target.value)}
                  style={{ ...textArea, fontFamily: 'monospace', fontSize: '0.875rem' }}
                />
              </div>

              {/* Quality Message */}
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: colors.pageBackground,
                  borderRadius: '0.5rem',
                }}
              >
                <p style={{ fontSize: '0.875rem', color: colors.body }}>
                  <strong>Quality Assessment:</strong> {getConfidenceMessage(ocr.ocrConfidence)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Test Instructions */}
        <div
          style={{
            marginTop: '2rem',
            backgroundColor: '#eff6ff',
            borderRadius: '0.5rem',
            padding: '1.5rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1e3a8a',
              marginBottom: '1rem',
            }}
          >
            Testing Instructions
          </h2>
          <ul
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              color: colors.primaryDark,
            }}
          >
            <li>✅ Test with WhatsApp screenshots in <strong>light mode</strong></li>
            <li>✅ Test with WhatsApp screenshots in <strong>dark mode</strong></li>
            <li>✅ Test with different image qualities and resolutions</li>
            <li>✅ Check if numbers and prices are extracted correctly</li>
            <li>✅ Verify confidence scores match visual quality</li>
            <li>✅ Test with Ctrl+V paste functionality</li>
            <li>✅ Test with drag and drop functionality</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
