'use client';

import { colors } from '../../ui/theme';

type ImagePreviewProps = {
  src: string;
  alt: string;
  onRemove: () => void;
};

export default function ImagePreview({ src, alt, onRemove }: ImagePreviewProps) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ position: 'relative' }}>
        <img
          src={src}
          alt={alt}
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: '0.5rem',
            border: `1px solid ${colors.border}`,
          }}
        />
        <button
          type="button"
          onClick={onRemove}
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            backgroundColor: colors.danger,
            color: 'white',
            padding: '0.5rem',
            borderRadius: '50%',
            cursor: 'pointer',
            border: 'none',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(event) =>
            (event.currentTarget.style.backgroundColor = colors.dangerDark)
          }
          onMouseLeave={(event) => (event.currentTarget.style.backgroundColor = colors.danger)}
        >
          <svg
            style={{ height: '1rem', width: '1rem' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
