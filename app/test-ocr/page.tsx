'use client';

import { useState, useRef } from 'react';
import { extractTextFromImage, isLowConfidence, getConfidenceMessage } from '../../lib/ocr';
import { describeError } from '../../lib/errors';

export default function TestOCR() {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrError, setOcrError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setOcrError(null);

    if (!file.type.startsWith('image/')) {
      setOcrError('That file is not an image. Please select a screenshot image.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.onerror = () => {
      console.error('Failed to read the selected image for preview:', reader.error);
      setPreviewImage(null);
      setOcrError('Could not read the selected image, so no preview is shown.');
    };
    reader.readAsDataURL(file);

    // Process with OCR
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
      setOcrError(describeError(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          handleFileSelect(file);
        }
        break;
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];

    if (!file) {
      setOcrError('No image was found in the drop. Please try again.');
      return;
    }

    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const reset = () => {
    setOcrText('');
    setOcrConfidence(0);
    setPreviewImage(null);
    setOcrError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>OCR Test Page</h1>
          <p style={{ fontSize: '1.125rem', color: '#4b5563' }}>Test text extraction from screenshots</p>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}>
          {/* Error */}
          {ocrError && (
            <div
              role="alert"
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                color: '#b91c1c',
                fontSize: '0.875rem',
              }}
            >
              {ocrError}
            </div>
          )}

          {/* File Upload Zone */}
          {!previewImage && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onPaste={handlePaste}
              style={{
                marginBottom: '1rem',
                border: '2px dashed #d1d5db',
                borderRadius: '0.5rem',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
              <div style={{ color: '#6b7280' }}>
                <svg style={{ margin: '0 auto 1rem', height: '3rem', width: '3rem', color: '#9ca3af' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>Upload a screenshot to test OCR</p>
                <p style={{ fontSize: '0.875rem' }}>Drag and drop, paste (Ctrl+V), or click to select</p>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>Test with WhatsApp screenshots (light and dark mode)</p>
              </div>
            </div>
          )}

          {/* Image Preview */}
          {previewImage && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={previewImage}
                  alt="Test image"
                  style={{ width: '100%', height: 'auto', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                />
                <button
                  onClick={reset}
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '0.5rem',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                >
                  <svg style={{ height: '1rem', width: '1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* OCR Progress */}
          {isProcessing && (
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1e40af' }}>{ocrStatus}</span>
                <span style={{ fontSize: '0.875rem', color: '#2563eb' }}>{Math.round(ocrProgress)}%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#dbeafe', borderRadius: '9999px', height: '0.5rem', overflow: 'hidden' }}>
                <div
                  style={{
                    backgroundColor: '#2563eb',
                    height: '100%',
                    transition: 'width 0.3s ease',
                    width: `${ocrProgress}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* OCR Result */}
          {ocrText && !isProcessing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Confidence Score */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                <span style={{ fontWeight: '500', color: '#374151' }}>OCR Confidence</span>
                <span style={{
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  color: ocrConfidence >= 80 ? '#16a34a' : ocrConfidence >= 60 ? '#ca8a04' : '#dc2626'
                }}>
                  {Math.round(ocrConfidence)}%
                </span>
              </div>

              {/* Confidence Warning */}
              {isLowConfidence(ocrConfidence) && (
                <div style={{ padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <svg style={{ height: '1.25rem', width: '1.25rem', color: '#d97706', marginRight: '0.5rem', marginTop: '0.125rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p style={{ fontWeight: '500', color: '#92400e' }}>Low Text Quality Detected</p>
                      <p style={{ fontSize: '0.875rem', color: '#b45309', marginTop: '0.25rem' }}>{getConfidenceMessage(ocrConfidence)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Extracted Text */}
              <div>
                <h3 style={{ fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Extracted Text</h3>
                <textarea
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  style={{
                    width: '100%',
                    height: '16rem',
                    padding: '1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    resize: 'none',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Quality Message */}
              <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                  <strong>Quality Assessment:</strong> {getConfidenceMessage(ocrConfidence)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Test Instructions */}
        <div style={{ marginTop: '2rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '1rem' }}>Testing Instructions</h2>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#1e40af' }}>
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