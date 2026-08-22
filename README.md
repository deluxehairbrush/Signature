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

### 🖼️ OCR Screenshot Support
- **Dual input modes** - Paste chat text OR upload screenshots
- **Client-side OCR** using tesseract.js (no API key, no server cost)
- **Multiple upload methods** - File selection, drag & drop, Ctrl+V paste
- **Progress tracking** - Real-time OCR progress indicator
- **Confidence scoring** - Quality assessment with user warnings
- **Editable preview** - Review and correct extracted text before submission
- **Low-confidence warnings** - Alerts users when text quality is poor
- **WhatsApp-friendly** - Optimized for chat screenshot extraction

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
│   ├── components/
│   │   └── DealForm.tsx        # Deal creation form with OCR support
│   ├── test-ocr/
│   │   └── page.tsx           # OCR testing page
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx               # Homepage with deal form
├── lib/
│   ├── ai.ts                  # Core AI functions (chatToContract, redFlagCheck, computeReputationScore)
│   ├── ai-api.ts              # API utilities (rate limiting, error handling)
│   └── ocr.ts                 # OCR utilities using tesseract.js
├── scripts/
│   ├── stress-chat-to-contract.ts  # AI testing utilities
│   ├── test-badge.ts               # Badge logic testing
│   └── test-ocr-basic.ts          # OCR utility testing
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
    ],
    "scopeReviewUnavailable": "boolean"
  }
}
```

`scopeReviewUnavailable` is `true` when the deterministic checks ran but the
optional AI scope review failed, so the flag list may be incomplete.

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
- Always returns a valid SVG for embedding, never an error page
- If the reputation lookup fails, returns an "unavailable" badge with
  `X-Badge-Status: reputation-unavailable` and `Cache-Control: no-store`, so a
  failure is never cached or mistaken for "no data"
- Uses mock data currently - needs Supabase integration

## OCR Integration

The Signature app includes client-side OCR functionality using tesseract.js, allowing users to extract text from chat screenshots instead of manually copying and pasting.

### Features

**Dual Input Modes:**
- **Text Mode**: Traditional text paste input
- **Image Mode**: Screenshot upload with OCR extraction

**Multiple Upload Methods:**
- File selection via click
- Drag and drop images
- Clipboard paste (Ctrl+V)

**OCR Processing:**
- Real-time progress tracking with status updates
- Confidence scoring (0-100%) 
- Quality-based warnings for low-confidence extractions
- Editable preview for user verification

**Quality Thresholds:**
- **High confidence (80%+)**: Text quality is good
- **Medium confidence (60-79%)**: Acceptable but double-check numbers
- **Low confidence (<60%)**: Poor quality, careful review needed

**User Interface:**
- Progress bar during OCR processing
- Color-coded confidence indicators
- Warning banners for low-quality extractions
- Editable textarea for corrections before submission
- Image preview with remove option

### Usage Example

1. **Upload Screenshot:**
   - Click "Upload Screenshot" button
   - Drag and drop an image, or
   - Paste an image (Ctrl+V)

2. **OCR Processing:**
   - System extracts text automatically
   - Progress bar shows processing status
   - Confidence score displayed

3. **Review and Edit:**
   - Check extracted text for accuracy
   - Correct any OCR errors (especially numbers/prices)
   - Heed low-confidence warnings

4. **Generate Contract:**
   - Submit corrected text to AI analysis
   - Get structured contract summary

### Testing

Visit `/test-ocr` to test OCR functionality with:
- WhatsApp screenshots (light mode)
- WhatsApp screenshots (dark mode)
- Different image qualities
- Various input methods

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
- Typed errors (`AiConfigError`, `AiResponseError`, `OcrError` in `lib/errors.ts`)
  let each layer map a failure to the right status code and message
- Distinguishes between misconfiguration (500), timeout (504), provider rate
  limit (503), unusable AI response (502), and bad requests (400)
- Error messages name the failed operation instead of always reporting a
  summary failure
- Includes fallback messages for frontend display
- Never blocks the form - allows manual entry as fallback
- Client requests check the HTTP status and payload shape, so a non-JSON or
  unexpected response is reported instead of being shown as a network error
- `app/error.tsx` renders uncaught render errors with a retry action

### OCR Implementation
- Client-side processing using tesseract.js (no server costs)
- Progress tracking with real-time status updates
- Confidence scoring with quality thresholds
- Multiple input methods: file upload, drag & drop, clipboard paste
- Editable preview for user verification before submission
- Low-confidence warnings with user guidance
- Optimized for chat screenshots (WhatsApp, etc.)
- Graceful degradation on OCR failures

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
- `tesseract.js` - Client-side OCR for screenshot text extraction

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

4. Test the OCR functionality:
- Visit `http://localhost:3000` for the main deal creation form
- Visit `http://localhost:3000/test-ocr` for the OCR testing page
- Upload WhatsApp screenshots (light and dark mode) to test text extraction
- Try different input methods: file upload, drag & drop, and Ctrl+V paste

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
- OCR screenshot support with tesseract.js
- Dual input modes (text paste and image upload)
- Real-time OCR progress tracking
- Confidence scoring and quality warnings
- Editable text preview before submission
- Multiple upload methods (file, drag & drop, clipboard paste)

🚧 **Future Enhancements:**
- Supabase integration for badge data fetching
- User authentication flow
- Database persistence
- Additional AI features
- Unit tests
- Integration tests
- Badge customization options
- Multi-language OCR support
- Advanced image preprocessing for better OCR accuracy
- Dark mode WhatsApp screenshot optimization

## License

ISC