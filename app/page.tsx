'use client';

import { useState } from 'react';
import DealForm from './components/DealForm';

export default function Home() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (rawText: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rawText }),
      });

      const data = await response.json();

      if (data.ok) {
        setResult(data.deal);
      } else {
        setError(data.error || 'Failed to process the chat');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Signature</h1>
          <p style={{ fontSize: '1.125rem', color: '#4b5563' }}>AI-powered contract analysis and validation system</p>
          <a href="/test-ocr" style={{ display: 'inline-block', marginTop: '1rem', color: '#2563eb', textDecoration: 'none' }}>
            Test OCR functionality →
          </a>
        </div>

        <DealForm onSubmit={handleSubmit} isLoading={isLoading} />

        {/* Results Display */}
        {result && (
          <div style={{ marginTop: '2rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Contract Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
                <div>
                  <span style={{ fontWeight: '500', color: '#374151' }}>Freelancer:</span>
                  <span style={{ marginLeft: '0.5rem' }}>{result.freelancerName || 'Not specified'}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '500', color: '#374151' }}>Client:</span>
                  <span style={{ marginLeft: '0.5rem' }}>{result.clientName || 'Not specified'}</span>
                </div>
              </div>
              
              <div>
                <span style={{ fontWeight: '500', color: '#374151' }}>Scope:</span>
                <p style={{ marginTop: '0.25rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>{result.scope || 'Not specified'}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
                <div>
                  <span style={{ fontWeight: '500', color: '#374151' }}>Price:</span>
                  <span style={{ marginLeft: '0.5rem' }}>
                    {result.price ? `${result.price} ${result.currency}` : 'Not specified'}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: '500', color: '#374151' }}>Deadline:</span>
                  <span style={{ marginLeft: '0.5rem' }}>{result.deadline || 'Not specified'}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
                <div>
                  <span style={{ fontWeight: '500', color: '#374151' }}>Payment Terms:</span>
                  <span style={{ marginLeft: '0.5rem' }}>{result.paymentTerms || 'Not specified'}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '500', color: '#374151' }}>Revisions:</span>
                  <span style={{ marginLeft: '0.5rem' }}>{result.revisions || 'Not specified'}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
                <div>
                  <span style={{ fontWeight: '500', color: '#374151' }}>Confidence:</span>
                  <span style={{
                    marginLeft: '0.5rem',
                    fontWeight: '500',
                    color: result.confidence === 'high' ? '#16a34a' : result.confidence === 'medium' ? '#ca8a04' : '#dc2626'
                  }}>
                    {result.confidence}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: '500', color: '#374151' }}>Missing Fields:</span>
                  <span style={{ marginLeft: '0.5rem' }}>
                    {result.missingFields.length > 0 ? result.missingFields.join(', ') : 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{ marginTop: '2rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#991b1b', marginBottom: '0.5rem' }}>Error</h2>
            <p style={{ color: '#b91c1c' }}>{error}</p>
          </div>
        )}

        {/* Badge API Info */}
        <div style={{ marginTop: '2rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Badge API</h2>
          <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
            Generate trust badges for users using our public API:
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <code style={{ backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>/badge/[username]</code> - Get trust badge for a user
            </li>
            <li>
              <code style={{ backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>/badge/[username].svg</code> - Get trust badge with .svg extension
            </li>
          </ul>
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Examples:</h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>
                <a href="/badge/johndoe" style={{ color: '#2563eb', textDecoration: 'none' }}>
                  /badge/johndoe
                </a>
              </li>
              <li>
                <a href="/badge/johndoe.svg" style={{ color: '#2563eb', textDecoration: 'none' }}>
                  /badge/johndoe.svg
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}