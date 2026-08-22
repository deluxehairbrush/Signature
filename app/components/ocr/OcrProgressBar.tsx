'use client';

import { colors } from '../../ui/theme';

type OcrProgressBarProps = {
  status: string;
  progress: number;
};

export default function OcrProgressBar({ status, progress }: OcrProgressBarProps) {
  return (
    <div
      style={{
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: '#eff6ff',
        borderRadius: '0.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}
      >
        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: colors.primaryDark }}>
          {status}
        </span>
        <span style={{ fontSize: '0.875rem', color: colors.primary }}>
          {Math.round(progress)}%
        </span>
      </div>
      <div
        style={{
          width: '100%',
          backgroundColor: '#dbeafe',
          borderRadius: '9999px',
          height: '0.5rem',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            backgroundColor: colors.primary,
            height: '100%',
            transition: 'width 0.3s ease',
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}
