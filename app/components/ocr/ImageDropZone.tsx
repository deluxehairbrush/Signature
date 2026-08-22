'use client';

import type { RefObject } from 'react';
import { colors } from '../../ui/theme';

type ImageDropZoneProps = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPaste: (event: React.ClipboardEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  title: string;
  hint: string;
};

export default function ImageDropZone({
  fileInputRef,
  onFileInputChange,
  onPaste,
  onDrop,
  onDragOver,
  title,
  hint,
}: ImageDropZoneProps) {
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onPaste={onPaste}
      style={{
        marginBottom: '1rem',
        border: `2px dashed ${colors.border}`,
        borderRadius: '0.5rem',
        padding: '2rem',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
      onClick={() => fileInputRef.current?.click()}
      onMouseEnter={(event) => (event.currentTarget.style.borderColor = colors.primary)}
      onMouseLeave={(event) => (event.currentTarget.style.borderColor = colors.border)}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileInputChange}
        style={{ display: 'none' }}
      />
      <div style={{ color: colors.muted }}>
        <svg
          style={{ margin: '0 auto 1rem', height: '3rem', width: '3rem', color: colors.subtle }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>{title}</p>
        <p style={{ fontSize: '0.875rem' }}>Drag and drop, paste (Ctrl+V), or click to select</p>
        <p style={{ fontSize: '0.75rem', color: colors.subtle, marginTop: '0.5rem' }}>{hint}</p>
      </div>
    </div>
  );
}
