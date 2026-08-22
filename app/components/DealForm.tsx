'use client';

import { useState, useRef } from 'react';
import { extractTextFromImage, isLowConfidence, getConfidenceMessage } from '../../lib/ocr';
import { describeError } from '../../lib/errors';

interface DealFormProps {
  onSubmit: (rawText: string) => Promise<void>;
  isLoading?: boolean;
}

type InputMode = 'text' | 'image';

export default function DealForm({ onSubmit, isLoading = false }: DealFormProps) {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [rawText, setRawText] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Rejections from onSubmit are not caught by React error boundaries, so
  // surface them in the form instead of leaving an unhandled rejection.
  const submitText = async (text: string) => {
    setFormError(null);

    try {
      await onSubmit(text);
    } catch (error) {
      console.error('Submitting the conversation failed:', error);
      setFormError(describeError(error) || 'Could not submit the conversation.');
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rawText.trim()) {
      await submitText(rawText);
    }
  };

  const handleOCRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ocrText.trim()) {
      await submitText(ocrText);
    }
  };

  const handleFileSelect = async (file: File) => {
    setFormError(null);

    if (!file.type.startsWith('image/')) {
      setFormError('That file is not an image. Please select a screenshot image.');
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
      setFormError('Could not read the selected image, so no preview is shown.');
    };
    reader.readAsDataURL(file);

    // Process with OCR
    setIsProcessing(true);
    setOcrProgress(0);
    setOcrStatus('Initializing...');
    setOcrText('');
    setShowWarning(false);

    try {
      const result = await extractTextFromImage(file, (progress) => {
        setOcrProgress(progress.progress);
        setOcrStatus(progress.status);
      });

      setOcrText(result.text);
      setOcrConfidence(result.confidence);
      setShowWarning(isLowConfidence(result.confidence));
    } catch (error) {
      console.error('OCR failed:', error);
      setFormError(describeError(error));
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
      setFormError('No image was found in the drop. Please try again.');
      return;
    }

    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const resetOCR = () => {
    setOcrText('');
    setOcrConfidence(0);
    setPreviewImage(null);
    setShowWarning(false);
    setFormError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Create Deal from Chat</h2>

        {formError && (
          <div
            role="alert"
            style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              color: '#b91c1c',
              fontSize: '0.875rem',
            }}
          >
            {formError}
          </div>
        )}
        
        {/* Input Mode Toggle */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => {
              setInputMode('text');
              resetOCR();
              setFormError(null);
            }}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              backgroundColor: inputMode === 'text' ? '#2563eb' : '#e5e7eb',
              color: inputMode === 'text' ? 'white' : '#374151',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Paste Chat Text
          </button>
          <button
            type="button"
            onClick={() => {
              setInputMode('image');
              setRawText('');
              setFormError(null);
            }}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              backgroundColor: inputMode === 'image' ? '#2563eb' : '#e5e7eb',
              color: inputMode === 'image' ? 'white' : '#374151',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Upload Screenshot
          </button>
        </div>

        {/* Text Input Mode */}
        {inputMode === 'text' && (
          <form onSubmit={handleTextSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="chatText" style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Chat Conversation
              </label>
              <textarea
                id="chatText"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste your chat conversation here..."
                style={{
                  width: '100%',
                  height: '16rem',
                  padding: '1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  resize: 'none',
                  fontSize: '1rem'
                }}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !rawText.trim()}
              style={{
                width: '100%',
                backgroundColor: isLoading || !rawText.trim() ? '#9ca3af' : '#2563eb',
                color: 'white',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontWeight: '500',
                cursor: isLoading || !rawText.trim() ? 'not-allowed' : 'pointer',
                border: 'none',
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? 'Processing...' : 'Generate Contract Summary'}
            </button>
          </form>
        )}

        {/* Image Input Mode */}
        {inputMode === 'image' && (
          <form onSubmit={handleOCRSubmit}>
            {/* File Upload Zone */}
            {!previewImage && (
              <div
                ref={dropZoneRef}
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
                  <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>Upload a screenshot</p>
                  <p style={{ fontSize: '0.875rem' }}>Drag and drop, paste (Ctrl+V), or click to select</p>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>Supports WhatsApp screenshots and other chat images</p>
                </div>
              </div>
            )}

            {/* Image Preview */}
            {previewImage && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={previewImage}
                    alt="Uploaded screenshot"
                    style={{ width: '100%', height: 'auto', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                  />
                  <button
                    type="button"
                    onClick={resetOCR}
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
              <div style={{ marginBottom: '1rem' }}>
                {/* Confidence Warning */}
                {showWarning && (
                  <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <svg style={{ height: '1.25rem', width: '1.25rem', color: '#d97706', marginRight: '0.5rem', marginTop: '0.125rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#92400e' }}>Low Text Quality Detected</p>
                        <p style={{ fontSize: '0.875rem', color: '#b45309', marginTop: '0.25rem' }}>{getConfidenceMessage(ocrConfidence)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Confidence Score */}
                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>OCR Confidence</span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: ocrConfidence >= 80 ? '#16a34a' : ocrConfidence >= 60 ? '#ca8a04' : '#dc2626'
                  }}>
                    {Math.round(ocrConfidence)}%
                  </span>
                </div>

                {/* Editable Text Area */}
                <label htmlFor="ocrText" style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Extracted Text (editable)
                </label>
                <textarea
                  id="ocrText"
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  style={{
                    width: '100%',
                    height: '16rem',
                    padding: '1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    resize: 'none',
                    fontSize: '1rem'
                  }}
                  disabled={isLoading}
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Please review and correct any errors, especially numbers and prices
                </p>
              </div>
            )}

            {/* Submit Button */}
            {ocrText && !isProcessing && (
              <button
                type="submit"
                disabled={isLoading || !ocrText.trim()}
                style={{
                  width: '100%',
                  backgroundColor: isLoading || !ocrText.trim() ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  cursor: isLoading || !ocrText.trim() ? 'not-allowed' : 'pointer',
                  border: 'none',
                  transition: 'all 0.2s'
                }}
              >
                {isLoading ? 'Processing...' : 'Generate Contract Summary'}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}