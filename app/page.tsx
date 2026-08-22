'use client';

import { useState } from 'react';
import DealForm from './components/DealForm';
import SummaryField from './components/SummaryField';
import {
  card,
  cardTitle,
  colors,
  dealConfidenceColor,
  pageContainer,
  pageHeader,
  pageShell,
  pageSubtitle,
  pageTitle,
  twoColumnGrid,
} from './ui/theme';

const codeStyle = {
  backgroundColor: '#f3f4f6',
  padding: '0.25rem 0.5rem',
  borderRadius: '0.25rem',
} as const;

const linkStyle = { color: colors.primary, textDecoration: 'none' } as const;

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
    <div style={pageShell}>
      <div style={pageContainer}>
        <div style={pageHeader}>
          <h1 style={pageTitle}>Signature</h1>
          <p style={pageSubtitle}>AI-powered contract analysis and validation system</p>
          <a href="/test-ocr" style={{ ...linkStyle, display: 'inline-block', marginTop: '1rem' }}>
            Test OCR functionality →
          </a>
        </div>

        <DealForm onSubmit={handleSubmit} isLoading={isLoading} />

        {/* Results Display */}
        {result && (
          <div style={{ ...card, marginTop: '2rem' }}>
            <h2 style={cardTitle}>Contract Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={twoColumnGrid}>
                <SummaryField label="Freelancer" value={result.freelancerName} />
                <SummaryField label="Client" value={result.clientName} />
              </div>

              <SummaryField label="Scope" value={result.scope} block />

              <div style={twoColumnGrid}>
                <SummaryField
                  label="Price"
                  value={result.price ? `${result.price} ${result.currency}` : null}
                />
                <SummaryField label="Deadline" value={result.deadline} />
              </div>

              <div style={twoColumnGrid}>
                <SummaryField label="Payment Terms" value={result.paymentTerms} />
                <SummaryField label="Revisions" value={result.revisions} />
              </div>

              <div style={twoColumnGrid}>
                <SummaryField
                  label="Confidence"
                  value={result.confidence}
                  valueColor={dealConfidenceColor(result.confidence)}
                />
                <SummaryField
                  label="Missing Fields"
                  value={
                    result.missingFields.length > 0 ? result.missingFields.join(', ') : 'None'
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div
            style={{
              marginTop: '2rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              padding: '1.5rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#991b1b',
                marginBottom: '0.5rem',
              }}
            >
              Error
            </h2>
            <p style={{ color: '#b91c1c' }}>{error}</p>
          </div>
        )}

        {/* Badge API Info */}
        <div style={{ ...card, marginTop: '2rem' }}>
          <h2 style={cardTitle}>Badge API</h2>
          <p style={{ color: colors.body, marginBottom: '1rem' }}>
            Generate trust badges for users using our public API:
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <code style={codeStyle}>/badge/[username]</code> - Get trust badge for a user
            </li>
            <li>
              <code style={codeStyle}>/badge/[username].svg</code> - Get trust badge with .svg
              extension
            </li>
          </ul>
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Examples:</h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>
                <a href="/badge/johndoe" style={linkStyle}>
                  /badge/johndoe
                </a>
              </li>
              <li>
                <a href="/badge/johndoe.svg" style={linkStyle}>
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
