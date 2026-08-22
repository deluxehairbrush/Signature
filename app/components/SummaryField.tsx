import type { ReactNode } from 'react';
import { colors } from '../ui/theme';

type SummaryFieldProps = {
  label: string;
  value?: ReactNode;
  /** Render the value as a highlighted block instead of inline text. */
  block?: boolean;
  valueColor?: string;
};

const FALLBACK = 'Not specified';

export default function SummaryField({ label, value, block, valueColor }: SummaryFieldProps) {
  const displayValue = value === null || value === undefined || value === '' ? FALLBACK : value;

  return (
    <div>
      <span style={{ fontWeight: '500', color: colors.label }}>{label}:</span>
      {block ? (
        <p
          style={{
            marginTop: '0.25rem',
            padding: '0.75rem',
            backgroundColor: colors.pageBackground,
            borderRadius: '0.5rem',
          }}
        >
          {displayValue}
        </p>
      ) : (
        <span style={{ marginLeft: '0.5rem', fontWeight: valueColor ? '500' : undefined, color: valueColor }}>
          {displayValue}
        </span>
      )}
    </div>
  );
}
