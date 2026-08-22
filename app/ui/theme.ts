import type { CSSProperties } from 'react';
import { getConfidenceLevel } from '../../lib/ocr';

export const colors = {
  pageBackground: '#f9fafb',
  surface: 'white',
  border: '#d1d5db',
  heading: '#111827',
  label: '#374151',
  body: '#4b5563',
  muted: '#6b7280',
  subtle: '#9ca3af',
  primary: '#2563eb',
  primaryDark: '#1e40af',
  disabled: '#9ca3af',
  danger: '#ef4444',
  dangerDark: '#dc2626',
  success: '#16a34a',
  warning: '#ca8a04',
} as const;

export const pageShell: CSSProperties = {
  minHeight: '100vh',
  backgroundColor: colors.pageBackground,
  padding: '2rem 0',
};

export const pageContainer: CSSProperties = {
  maxWidth: '56rem',
  margin: '0 auto',
  padding: '0 1rem',
};

export const pageHeader: CSSProperties = {
  textAlign: 'center',
  marginBottom: '2rem',
};

export const pageTitle: CSSProperties = {
  fontSize: '2.25rem',
  fontWeight: 'bold',
  color: colors.heading,
  marginBottom: '0.5rem',
};

export const pageSubtitle: CSSProperties = {
  fontSize: '1.125rem',
  color: colors.body,
};

export const card: CSSProperties = {
  backgroundColor: colors.surface,
  borderRadius: '0.5rem',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  padding: '1.5rem',
};

export const cardTitle: CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  marginBottom: '1rem',
};

export const fieldLabel: CSSProperties = {
  display: 'block',
  fontWeight: '500',
  marginBottom: '0.5rem',
  color: colors.label,
};

export const textArea: CSSProperties = {
  width: '100%',
  height: '16rem',
  padding: '1rem',
  border: `1px solid ${colors.border}`,
  borderRadius: '0.5rem',
  resize: 'none',
  fontSize: '1rem',
};

export const twoColumnGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '1rem',
};

export function primaryButton(disabled: boolean): CSSProperties {
  return {
    width: '100%',
    backgroundColor: disabled ? colors.disabled : colors.primary,
    color: 'white',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    fontWeight: '500',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'all 0.2s',
  };
}

export function toggleButton(active: boolean): CSSProperties {
  return {
    flex: 1,
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    fontWeight: '500',
    transition: 'all 0.2s',
    backgroundColor: active ? colors.primary : '#e5e7eb',
    color: active ? 'white' : colors.label,
    border: 'none',
    cursor: 'pointer',
  };
}

/**
 * Color for a raw OCR confidence score (0-100).
 */
export function confidenceColor(confidence: number): string {
  switch (getConfidenceLevel(confidence)) {
    case 'good':
      return colors.success;
    case 'acceptable':
      return colors.warning;
    case 'low':
      return colors.dangerDark;
  }
}

/**
 * Color for the qualitative confidence returned by the AI deal summary.
 */
export function dealConfidenceColor(confidence: string): string {
  if (confidence === 'high') {
    return colors.success;
  }

  if (confidence === 'medium') {
    return colors.warning;
  }

  return colors.dangerDark;
}
