'use client';

import type { CSSProperties } from 'react';
import { colors, confidenceColor } from '../../ui/theme';

type ConfidenceScoreProps = {
  confidence: number;
  /** `compact` sits above the textarea, `panel` is a standalone card row. */
  variant?: 'compact' | 'panel';
};

const containerStyles: Record<'compact' | 'panel', CSSProperties> = {
  compact: {
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    backgroundColor: colors.pageBackground,
    borderRadius: '0.5rem',
  },
};

const labelStyles: Record<'compact' | 'panel', CSSProperties> = {
  compact: { fontSize: '0.875rem', fontWeight: '500', color: colors.label },
  panel: { fontWeight: '500', color: colors.label },
};

const valueStyles: Record<'compact' | 'panel', CSSProperties> = {
  compact: { fontSize: '0.875rem', fontWeight: '500' },
  panel: { fontSize: '1.125rem', fontWeight: 'bold' },
};

export default function ConfidenceScore({
  confidence,
  variant = 'compact',
}: ConfidenceScoreProps) {
  return (
    <div style={containerStyles[variant]}>
      <span style={labelStyles[variant]}>OCR Confidence</span>
      <span style={{ ...valueStyles[variant], color: confidenceColor(confidence) }}>
        {Math.round(confidence)}%
      </span>
    </div>
  );
}
