# Signature

AI-powered contract analysis and validation system for freelance agreements.

## Overview

Signature provides intelligent tools to convert informal chat conversations into structured contract summaries and automatically detect potential red flags in freelance deals. The system uses Groq's LLM to extract key contract details and identify issues that might cause disputes.

## Features

### 🤖 AI Contract Summarization
- **POST `/api/ai/summarize`** - Converts chat conversations into structured deal summaries
- Extracts freelancer/client names, scope, price, deadline, payment terms, and revisions
- Handles multi-language conversations (English, Hinglish, mixed)
- Provides confidence levels and identifies missing fields
- Returns structured JSON matching the deal schema

### 🚩 Red Flag Detection
- **POST `/api/ai/redflags`** - Analyzes deal summaries for potential issues
- Detects missing or invalid prices, deadlines, and payment terms
- Identifies vague or incomplete scope descriptions
- Flags unrealistic deadlines based on work scope
- Uses AI judgment for ambiguous scope cases

### 🔒 Rate Limiting
- 10 requests per minute per user
- Uses Supabase auth session for user identification
- Falls back to IP-based limiting for unauthenticated requests
- Prevents quota abuse during testing and development

### 🏆 Public Trust Badges
- **GET `/badge/[username]`** - Public endpoint for user reputation badges
- **GET `/badge/[username].svg`** - Same endpoint with .svg extension for embed contexts
- Generates SVG badges showing trust score and deal count
- Color-coded: green (70+), yellow (40-69), gray (<40 or no data)
- No authentication required - designed for public embedding
- Includes cache headers for performance (public, max-age=300)
- Graceful error handling - always returns valid SVG

### ⚡ Error Handling
- Graceful degradation when AI services fail
- Fallback messages for frontend display
- Proper HTTP status codes (429, 502, 503, 504)
- Timeout detection and handling
- Retry-after headers for rate-limited requests

## Project Structure

```
Signature/
├── app/
│   ├── api/
│   │   └── ai/
│   │       ├── summarize/
│   │       │   └── route.ts    # Chat-to-contract API endpoint
│   │       └── redflags/
│   │           └── route.ts    # Red flag detection API endpoint
│   ├── badge/
│   │   └── [username]/
│   │       └── route.ts        # Public trust badge endpoint
│   ├── layout.tsx              # Root layout
│   └── page.tsx               # Homepage
├── lib/
│   ├── ai.ts                  # Core AI functions (chatToContract, redFlagCheck, computeReputationScore)
│   └── ai-api.ts              # API utilities (rate limiting, error handling)
├── scripts/
│   ├── stress-chat-to-contract.ts  # AI testing utilities
│   └── test-badge.ts               # Badge logic testing
├── next.config.js            # Next.js configuration
└── package.json
```

## API Endpoints

### POST /api/ai/summarize

Converts a chat conversation into a structured deal summary.

**Request Body:**
```json
{
  "rawText": "string (required) - The chat conversation text"
}
```

**Response:**
```json
{
  "ok": true,
  "deal": {
    "freelancerName": "string | null",
    "clientName": "string | null",
    "scope": "string",
    "price": "number | null",
    "currency": "string",
    "deadline": "string | null",
    "paymentTerms": "string | null",
    "revisions": "string | null",
    "confidence": "high | medium | low",
    "missingFields": ["string"]
  }
}
```

**Error Response:**
```json
{
  "ok": false,
  "error": "string",
  "fallbackMessage": "Couldn't auto-generate the summary, you can fill it in manually"
}
```

### POST /api/ai/redflags

Analyzes a deal summary for potential red flags.

**Request Body:**
```json
{
  "deal": {
    "freelancerName": "string | null",
    "clientName": "string | null",
    "scope": "string",
    "price": "number | null",
    "currency": "string",
    "deadline": "string | null",
    "paymentTerms": "string | null",
    "revisions": "string | null",
    "confidence": "high | medium | low",
    "missingFields": ["string"]
  }
}
```

**Response:**
```json
{
  "ok": true,
  "result": {
    "hasRedFlags": "boolean",
    "flags": [
      {
        "field": "string",
        "issue": "string"
      }
    ]
  }
}
```

### GET /badge/[username]

Generates a public SVG badge showing a user's trust score and deal count.

**Parameters:**
- `username` (path parameter) - The username to look up

**Response:**
- Content-Type: `image/svg+xml`
- Returns an SVG badge with:
  - Left side: "TrustGig" label
  - Right side: Score (e.g., "87/100") and deal count (e.g., "12 deals")
  - Color-coded based on score:
    - Green (#10B981): Score 70+
    - Yellow (#F59E0B): Score 40-69
    - Gray (#9CA3AF): Score <40 or no data

**Headers:**
- `Cache-Control: public, max-age=300, s-maxage=600`
- `Access-Control-Allow-Origin: *`

**Examples:**
- `/badge/johndoe` - Returns badge for user "johndoe"
- `/badge/johndoe.svg` - Same endpoint with .svg extension for embed contexts

**Behavior:**
- If username doesn't exist or has no deals, returns "no data" badge
- Never errors - always returns a valid SVG for embedding
- Uses mock data currently - needs Supabase integration

## Implementation Details

### AI Model
- Uses Groq's Llama 3.3 70B Versatile model
- JSON schema validation with Zod
- Retry logic for failed AI responses
- Prompt engineering to prevent hallucination

### Rate Limiting Strategy
- In-memory rate limit buckets per user/IP
- 60-second sliding window
- 10 requests maximum per window
- JWT token parsing for Supabase user identification
- IP fallback for unauthenticated requests

### Error Handling
- Distinguishes between timeout, rate limit, and general errors
- Returns appropriate HTTP status codes
- Includes fallback messages for frontend display
- Never blocks the form - allows manual entry as fallback

### Badge System
- SVG template-based generation (no external dependencies)
- Shields.io-style badge layout
- Color coding based on reputation score thresholds
- Public endpoint with no authentication required
- Cache headers for performance optimization
- Graceful degradation - always returns valid SVG
- Supports both `/badge/[username]` and `/badge/[username].svg` formats

## Dependencies

- `next` - Next.js framework
- `openai` - OpenAI SDK for Groq API
- `zod` - Schema validation
- `typescript` - Type safety

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# Create .env.local with your Groq API key
GROQ_API_KEY=your_groq_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

## Current Status

✅ **Completed Features:**
- AI contract summarization API endpoint
- Red flag detection API endpoint  
- Rate limiting implementation
- Comprehensive error handling
- TypeScript type safety
- Zod schema validation
- Public trust badge endpoint with SVG generation
- Color-coded reputation badges
- Cache headers for performance
- Graceful error handling for badge endpoint

🚧 **Future Enhancements:**
- Supabase integration for badge data fetching
- Frontend integration
- User authentication flow
- Database persistence
- Additional AI features
- Unit tests
- Integration tests
- Badge customization options

## License

ISC