'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled error while rendering:', error);
  }, [error]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' }}>
      <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '0 1rem' }}>
        <div
          role="alert"
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '1.5rem',
          }}
        >
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#991b1b', marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#b91c1c', marginBottom: '1rem' }}>{error.message}</p>
          {error.digest && (
            <p style={{ color: '#b91c1c', fontSize: '0.75rem', marginBottom: '1rem' }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => retry()}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
