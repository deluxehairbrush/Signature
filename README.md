# Signature

A public home for freelance work — a profile that speaks for itself, and a
deal history that isn't just a claim. Freelancers and clients get real
profiles, a searchable public directory, AI-assisted deal creation from a
raw chat conversation, a real deal lifecycle (propose → accept → sign →
complete), reviews, an open work board, in-app messaging, and
notifications.

**Live locally right now:** a Next.js frontend talking to a real Django
REST backend — not a mockup. Every feature below has been exercised
end-to-end against a running instance, not just wired and assumed to work.

## Architecture

```
┌─────────────────────┐         ┌──────────────────────────┐
│   Next.js frontend   │  REST   │   Django REST backend     │
│   (this repo, root)  │◄───────►│   (backend/)               │
│   app/, lib/, public/ │  JWT    │   apps/*, SQLite or        │
└──────────┬───────────┘         │   PostgreSQL                │
           │                     └──────────┬───────────────┘
           │ same-origin                    │
           ▼                                ▼
   /api/ai/summarize              Groq (Llama 3.3 70B)
   /api/ai/redflags               via lib/ai.ts, proxied from
   (lib/ai.ts, Groq-backed)       backend/apps/ai_integration
```

The frontend and backend are separate deployables. The frontend calls the
backend directly for everything (auth, profiles, deals, search,
reputation, messaging, notifications) and calls its **own** `/api/ai/*`
routes directly for AI summarization — the Django backend also exposes
`/api/v1/ai/*` endpoints that proxy to those same Next.js routes
server-to-server, for use by other backend-side consumers.

## Features

### Brand & landing experience
- Horizontal, scroll-hijacked "chapter" landing page (vertical scroll
  drives horizontal motion) with 8 chapters: hero, what-this-is, create a
  profile, get found, build a record, built for both sides, browse
  profiles, closing CTA
- Original design system (not a copy of any reference site's assets):
  ink/paper/lime/violet palette, editorial serif (Fraunces) + sans
  (Inter), hand-drawn diagonal annotation lines, a floating bottom "running
  commentary" pill, a clickable right-edge chapter rail, a rotated
  left-edge step ruler, a slide-in chapter menu
- 3D touches: continuously-rotating isometric shapes, a 3D open-book
  shape, mouse-tracked tilt cards, cursor-parallax on decorative shapes, a
  direction-aware arrow cursor, a kinetic staggered headline reveal, a
  subtle animated film-grain overlay
- Fully responsive — verified narrow-viewport overflow fixes on every
  panel, not just desktop

### Auth
- Real JWT registration/login against the Django backend
  (`/api/v1/auth/register/`, `/login/`) — freelancer/client account type
  chosen at signup
- Google sign-in is stubbed (visibly disabled, "coming soon") — needs a
  real Google Cloud OAuth client ID/secret that only the project owner can
  create

### Freelancer & client profiles
- Freelancer: display name, headline, bio, location, timezone, hourly
  rate/currency, availability status, working hours, tags, social/contact
  links, portfolio (with image upload)
- Client: company name, industry, location, website, and a free-text
  "what are you hiring for" field (the backend's `ClientProfile` has no
  dedicated budget/deadline columns yet, so this is the honest mapping
  onto what exists today)
- Public profile pages (`/freelancers/[username]`, `/clients/[username]`)
  — **no account needed to view** — showing reputation breakdown
  (on-time completions, fair compensation, disputes, not just one
  aggregate score), portfolio grid, tags, and a "Hire" button
- Authenticated edit pages (`/profile/freelancer`, `/profile/client`)

### Browse & search
- `/browse` — live, debounced search against the backend's real search
  API (`apps.search`): by name/headline/bio, availability filter, sort by
  reputation/deals/rate. No placeholder data.

### AI-assisted deal creation
- Paste a chat conversation, or upload a screenshot (client-side OCR via
  tesseract.js — no server cost, works entirely in the browser)
- AI extraction (Groq, Llama 3.3 70B) pulls out scope, price, currency,
  deadline, payment terms, and flags what it couldn't determine rather
  than guessing
- Automatic red-flag detection (missing price, vague scope, unrealistic
  deadline, missing payment terms) shown before you create the deal
- Everything extracted is editable before submission

### Deal lifecycle
- Real state machine on the backend: `DRAFT → PROPOSED → ACCEPTED →
  COMPLETED` (plus `CANCELLED` / `DISPUTED` at various points), with a
  cryptographic proof/snapshot taken at completion
- A "Hire [name]" button from any public freelancer profile pre-fills deal
  creation targeting that specific person
- Deal detail page (`/deals/[id]`) exposes exactly the actions valid for
  the current status (propose, accept, sign, complete, cancel, dispute)
- A stamp-seal animation plays on successful deal creation

### Open work board
- A client can flag a deal "open to proposals" instead of assigning a
  specific freelancer
- `/deals/open` — any freelancer can browse open, unassigned deals and
  claim one (first-come-first-served, not a multi-candidate queue)

### Messaging
- A chat thread scoped to each deal (not a global DM system) — visible
  once a freelancer is assigned, for the two participants to discuss
  specifics without leaving the site

### Reviews / completion confirmations
- Once a deal is `COMPLETED`, either party can submit a confirmation:
  completed on time? compensation received/fair? work satisfactory? plus
  a free-text comment — this is the "verifiable history" the whole
  product is built around, not a self-reported star rating

### Notifications
- Notifications for every deal transition
  (proposed, accepted, signed, completed, cancelled, disputed, applied)
  and new messages, with an unread-count bell in the header of every
  authenticated page

### Public trust badges
- `GET /badge/[username]` (this Next.js app) — embeddable SVG badge,
  color-coded by score, currently using placeholder data pending backend
  wiring
- The Django backend separately exposes its own
  `GET /api/v1/badges/{username}/` (SVG) and `/json/` — **not yet wired to
  the Next.js route above**; these are two independent badge
  implementations right now, worth consolidating

## Tech stack

**Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
v3, Framer Motion, Tesseract.js (client-side OCR)

**Backend:** Django 5.1, Django REST Framework, SimpleJWT, django-filter,
drf-spectacular (OpenAPI docs), PostgreSQL (SQLite for local dev without
Docker)

**AI:** Groq (Llama 3.3 70B Versatile) via the OpenAI-compatible SDK

## Project structure

```
Signature/
├── app/                          # Next.js App Router
│   ├── api/ai/                   # Groq-backed summarize/red-flags routes
│   ├── badge/[username]/         # Public SVG badge (Next.js side)
│   ├── browse/                   # Live freelancer search
│   ├── freelancers/[username]/   # Public freelancer profile
│   ├── clients/[username]/       # Public client profile
│   ├── profile/{freelancer,client}/  # Authenticated profile editors
│   ├── deals/                    # List, detail, new, open work board
│   ├── login/, signup/           # Auth
│   ├── how-it-works/             # Static explainer page
│   └── components/               # Design system + feature components
├── lib/
│   ├── ai.ts, ai-api.ts          # Groq extraction, rate limiting
│   ├── ocr.ts                    # Client-side OCR (tesseract.js)
│   └── api.ts                    # All Django backend API calls
├── backend/                      # Django REST backend
│   ├── apps/
│   │   ├── accounts/             # JWT auth
│   │   ├── profiles/             # Freelancer/client profiles
│   │   ├── portfolio/            # Portfolio items (with public listing)
│   │   ├── deals/                # Deal lifecycle, messages, notifications,
│   │   │                         # open-work board, completion confirmations
│   │   ├── reputation/           # Reputation scoring
│   │   ├── search/                # Public freelancer/client search
│   │   ├── signatures/           # Deal signing
│   │   ├── tags/                  # Skill/industry tags
│   │   ├── badges/                # Django-side SVG/JSON badges (unwired)
│   │   ├── dashboard/             # Dashboard views (not yet used by frontend)
│   │   └── ai_integration/        # Proxies to this app's /api/ai/* routes
│   ├── config/                    # Django settings, urls
│   └── manage.py
├── scripts/                       # OCR test image generation/verification
└── public/                        # Static assets (logo, etc.)
```

## Getting started

### Frontend

```bash
npm install
```

Create `.env.local`:
```bash
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile   # optional, this is the default
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

```bash
npm run dev
```

### Backend

The backend defaults to PostgreSQL (matches `backend/docker-compose.yml`
exactly), but supports a `DB_ENGINE=sqlite` opt-in for local dev without
Docker/Postgres installed.

**Option A — Docker (matches production config):**
```bash
cd backend
docker compose up --build
```

**Option B — native, SQLite:**
```bash
cd backend
python -m venv .venv
.venv/Scripts/activate   # or source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
```
Create `backend/.env`:
```bash
SECRET_KEY=dev-secret-key-not-for-production
DEBUG=True
DB_ENGINE=sqlite
FRONTEND_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:3000
```
```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Demo data

```bash
cd backend
python manage.py seed_demo
```

Seeds 20 tags, 5 freelancers, 3 clients, and 5 deals across every status,
with portfolio items, social links, reputation scores, and signatures.
All demo accounts use password `demo1234` — e.g. `aisha@demo.com`,
`james@techcorp.com`. See the command output for the full list.

## API reference

The backend auto-generates OpenAPI docs via drf-spectacular:
- **Swagger UI:** `http://localhost:8000/api/docs/`
- **Raw schema:** `http://localhost:8000/api/schema/`

High-level endpoint groups (all under `/api/v1/`):

| Area | Base path | Notes |
|---|---|---|
| Auth | `/auth/` | register, login, token/refresh, logout, me, change-password |
| Freelancer profiles | `/freelancers/profile/`, `/freelancers/{username}/` | own-profile CRUD, public view |
| Client profiles | `/clients/profile/`, `/clients/{username}/` | own-profile CRUD, public view |
| Portfolio | `/portfolio/`, `/freelancers/{username}/portfolio/` | own-item CRUD, public listing |
| Social links | `/social-links/` | authenticated CRUD |
| Search | `/freelancers/?search=&tags=&min_rate=&max_rate=&availability_status=&ordering=`, `/clients/?...` | public, filterable |
| Deals | `/deals/` | create/list/detail; actions: `propose`, `accept`, `sign`, `complete`, `cancel`, `dispute`, `apply`, `completion` (GET/POST), `messages` (GET/POST), `proof` |
| Open work | `/deals/open/` | public list of deals flagged `is_open_to_proposals` |
| Notifications | `/notifications/`, `/notifications/{id}/read/`, `/notifications/read-all/` | authenticated |
| Reputation | `/reputation/{username}/` | public breakdown |
| Tags | `/tags/` | |
| AI (backend-proxied) | `/ai/summarize-deal/`, `/ai/red-flags/` | proxies to this Next.js app's own `/api/ai/*` |
| Badges (Django-side) | `/badges/{username}/`, `/badges/{username}/json/` | not yet wired to the Next.js `/badge/[username]` route |

## Design system

- **Colors:** `ink` (#12120D), `paper` (#F6F4EC), `accent` lime
  (#86C22A / pale wash #F3F7A8), `signal` violet (#7C3AED / dark #5B21B6)
  — sampled and adapted from a scroll-storytelling reference, not copied
  wholesale
- **Type:** Fraunces (display/italic serif headlines) + Inter (body/UI),
  loaded via `next/font/google`
- All tokens live in `tailwind.config.js` — changing a color there
  propagates through every page via shared components, not hardcoded
  hex values

## Known gaps / roadmap

- **Google OAuth** — button exists, disabled; needs real credentials from
  the project owner
- **Client compensation/deadline** — no dedicated backend fields yet;
  currently captured in a free-text field
- **Two badge implementations** — the Next.js `/badge/[username]` route
  (placeholder data) and the Django `/api/v1/badges/{username}/`
  endpoint (real data) aren't consolidated
- **`apps.dashboard`** exists on the backend but has no frontend pages
  yet
- **Notifications are fetched once per page load**, not push/websocket —
  the bell won't update live if a notification arrives while you're
  already on the page
- **Open work board is first-come-first-served**, not a multi-candidate
  application/review flow

## License

ISC
