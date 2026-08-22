'use client';

import { getConfidenceMessage } from '../../../lib/ocr';

type LowConfidenceWarningProps = {
  confidence: number;
};

export default function LowConfidenceWarning({ confidence }: LowConfidenceWarningProps) {
  return (
    <div
      style={{
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: '#fef3c7',
        border: '1px solid #fde68a',
        borderRadius: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <svg
          style={{
            height: '1.25rem',
            width: '1.25rem',
            color: '#d97706',
            marginRight: '0.5rem',
            marginTop: '0.125rem',
          }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#92400e' }}>
            Low Text Quality Detected
          </p>
          <p style={{ fontSize: '0.875rem', color: '#b45309', marginTop: '0.25rem' }}>
            {getConfidenceMessage(confidence)}
          </p>
        </div>
      </div>
    </div>
  );
}
