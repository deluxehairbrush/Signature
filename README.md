# Signature

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Django](https://img.shields.io/badge/Django-5.1-092E20?logo=django&logoColor=white)](https://www.djangoproject.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](#license)

A public home for freelance work — a profile that speaks for itself, and a
deal history that isn't just a claim. Freelancers and clients get real
profiles, a searchable public directory, AI-assisted deal creation from a
raw chat conversation, a full deal lifecycle with dispute resolution,
reviews, an open work board, in-app messaging with file attachments, a
client shortlist, and notifications.

**This isn't a mockup.** A Next.js frontend talks to a real Django REST
backend, both deployed and live. Every feature below has been exercised
end-to-end against a running instance.

### Live

| | URL |
|---|---|
| **App** | [signature-ochre-theta.vercel.app](https://signature-ochre-theta.vercel.app) |
| **API** | [signature-backend-hxn2.onrender.com](https://signature-backend-hxn2.onrender.com/api/v1/) · [Swagger docs](https://signature-backend-hxn2.onrender.com/api/docs/) |

Demo accounts (password `demo1234`): `aisha@demo.com`, `james@techcorp.com`
— see [Demo data](#demo-data) for the full list and how to reseed.

---

## Contents

- [Architecture](#architecture)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Deployment](#deployment)
- [API reference](#api-reference)
- [Design system](#design-system)
- [Known gaps / roadmap](#known-gaps--roadmap)

## Architecture

```
┌─────────────────────┐         ┌──────────────────────────┐
│   Next.js frontend   │  REST   │   Django REST backend     │
│   (this repo, root)  │◄───────►│   (backend/)               │
│   app/, lib/, public/ │  JWT    │   apps/*, Postgres         │
└──────────┬───────────┘         │   (SQLite for local dev)   │
           │                     └──────────┬───────────────┘
           │ same-origin                    │
           ▼                                ▼
   /api/ai/summarize              Groq (Llama 3.3 70B)
   /api/ai/redflags               via lib/ai.ts, proxied from
   (lib/ai.ts, Groq-backed)       backend/apps/ai_integration
```

The frontend and backend are separate deployables — frontend on Vercel,
backend on Render (see [Deployment](#deployment)). The frontend calls the
backend directly for everything (auth, profiles, deals, search,
reputation, messaging, notifications) and calls its **own** `/api/ai/*`
routes directly for AI summarization — the Django backend also exposes
`/api/v1/ai/*` endpoints that proxy to those same Next.js routes
server-to-server, for use by other backend-side consumers.

## Features

### Brand & landing experience
- Horizontal, scroll-hijacked "chapter" landing page (vertical scroll
  drives horizontal motion) across 9 chapters: hero, what-this-is, create
  a profile, get found, build a record, built for both sides, browse
  profiles, why we built this, closing CTA
- Original design system (not a copy of any reference site's assets):
  ink/paper/lime/violet palette, editorial serif (Fraunces) + sans
  (Inter), hand-drawn diagonal annotation lines, a floating bottom
  "running commentary" pill, a clickable right-edge chapter rail, a
  rotated left-edge step ruler, a slide-in chapter menu
- 3D touches, deliberately more than one shape family: a rotating
  isometric cube, a CSS-built pyramid, a tilted orbiting-dot ring, a 3D
  open-book shape, a mouse-tilt hero centerpiece, cursor-parallax on
  decorative shapes, a direction-aware arrow cursor, a word-by-word
  kinetic headline reveal, a subtle animated film-grain overlay
- Fully responsive — verified narrow-viewport overflow fixes on every
  panel, not just desktop

### Auth
- Real JWT registration/login against the Django backend
  (`/api/v1/auth/register/`, `/login/`) — freelancer/client account type
  chosen at signup
- **Google sign-in** — full Google Identity Services ID-token flow, both
  on signup and login. Verified server-side (`GoogleAuthView`); no client
  secret needed for this flow. Falls back to a disabled "coming soon"
  button if `NEXT_PUBLIC_GOOGLE_CLIENT_ID` isn't configured

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
- **Client shortlist** — save freelancers to compare later
  (`/shortlist`), toggled from any public freelancer profile

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
  ACTIVE → COMPLETED` (plus `CANCELLED` / `DISPUTED` branches), with a
  cryptographic proof/snapshot taken at completion
- A "Hire [name]" button from any public freelancer profile pre-fills deal
  creation targeting that specific person
- Deal detail page (`/deals/[id]`) exposes exactly the actions valid for
  the current status (propose, accept, sign, complete, cancel)
- A stamp-seal animation plays on successful deal creation

### Dispute resolution
- Either side can raise a dispute with a reason, moving the deal to
  `DISPUTED`
- The other side (or either, in practice) resolves it with one of three
  outcomes — refund the client, proceed with the work as-is, or cancel
  the deal — plus resolution notes; the deal transitions accordingly and
  both parties are notified
- A real mediation record, not a bare status flip

### Messaging
- A chat thread scoped to each deal (not a global DM system) — visible
  once a freelancer is assigned, for the two participants to discuss
  specifics without leaving the site
- **File attachments** — share a mockup, contract PDF, or reference file
  directly in the thread alongside text

### Open work board
- A client can flag a deal "open to proposals" instead of assigning a
  specific freelancer
- `/deals/open` — any freelancer can browse open, unassigned deals and
  claim one (first-come-first-served, not a multi-candidate queue)

### Reviews / completion confirmations
- Once a deal is `COMPLETED`, either party can submit a confirmation:
  completed on time? compensation received/fair? work satisfactory? plus
  a free-text comment — this is the "verifiable history" the whole
  product is built around, not a self-reported star rating

### Notifications
- Notifications for every deal transition (proposed, accepted, signed,
  completed, cancelled, disputed, dispute resolved, applied) and new
  messages, with an unread-count bell in the header of every
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
drf-spectacular (OpenAPI docs), google-auth (Google Identity Services
token verification), PostgreSQL (SQLite for local dev without Docker),
optional S3-compatible object storage for uploaded media

**AI:** Groq (Llama 3.3 70B Versatile) via the OpenAI-compatible SDK

**Infra:** Vercel (frontend), Render (backend + Postgres) — both have a
one-config deploy path, see [Deployment](#deployment)

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
│   ├── shortlist/                # Client's saved freelancers
│   ├── login/, signup/           # Auth, incl. Google sign-in
│   ├── how-it-works/             # Static explainer page
│   └── components/               # Design system + feature components
├── lib/
│   ├── ai.ts, ai-api.ts          # Groq extraction, rate limiting
│   ├── ocr.ts                    # Client-side OCR (tesseract.js)
│   └── api.ts                    # All Django backend API calls
├── backend/                      # Django REST backend
│   ├── apps/
│   │   ├── accounts/              # JWT auth + Google sign-in
│   │   ├── profiles/              # Freelancer/client profiles, shortlist
│   │   ├── portfolio/              # Portfolio items (with public listing)
│   │   ├── deals/                  # Deal lifecycle, disputes, messages
│   │   │                          # (+ attachments), notifications,
│   │   │                          # open-work board, completion confirmations
│   │   ├── reputation/             # Reputation scoring
│   │   ├── search/                  # Public freelancer/client search
│   │   ├── signatures/              # Deal signing
│   │   ├── tags/                    # Skill/industry tags
│   │   ├── badges/                  # Django-side SVG/JSON badges (unwired)
│   │   ├── dashboard/               # Dashboard views (not yet used by frontend)
│   │   └── ai_integration/          # Proxies to this app's /api/ai/* routes
│   ├── config/                      # Django settings, urls
│   ├── entrypoint.sh                # Runs migrations + seed_demo, then gunicorn
│   └── manage.py
├── scripts/                       # OCR test image generation/verification
├── render.yaml                    # One-click Render Blueprint (backend + DB)
├── vercel.json                    # Frontend-only service config for Vercel
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
NEXT_PUBLIC_GOOGLE_CLIENT_ID=        # optional — leave blank to disable Google sign-in
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
GOOGLE_OAUTH_CLIENT_ID=              # optional — leave blank to disable Google sign-in
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
`james@techcorp.com`. See the command output for the full list. The
command is idempotent (`get_or_create` throughout), so it's safe to run
repeatedly — `backend/entrypoint.sh` runs it on every container start in
production, which is how the live demo above always has data.

## Deployment

Both deploy configs live in this repo and are meant to be used together:

- **Backend → Render.** `render.yaml` is a Blueprint: point Render at
  this repo and it provisions a free Postgres instance plus the Django
  web service from `backend/Dockerfile`. Free-tier services can't run a
  `preDeployCommand`, so migrations (and demo seeding) run at container
  start via `backend/entrypoint.sh` instead. Set `FRONTEND_URL` /
  `AI_SERVICE_URL` to your Vercel URL once you have it, and optionally
  `GOOGLE_OAUTH_CLIENT_ID` / S3 credentials for media storage — Render's
  filesystem is ephemeral, so without S3 configured, uploaded portfolio
  images won't survive a redeploy.
- **Frontend → Vercel.** `vercel.json` declares this as a
  frontend-only service (the repo also contains the Django backend,
  which Vercel would otherwise try and fail to deploy alongside it) with
  a catch-all rewrite — both are required, a services block alone isn't
  enough to route traffic. Set `NEXT_PUBLIC_API_URL` to your Render
  backend's `/api/v1` URL and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` if using
  Google sign-in.
- **Google Cloud Console.** Add your Vercel URL under **Authorized
  JavaScript origins** on the OAuth client — no redirect URI needed,
  since the frontend uses Google Identity Services' popup ID-token flow.

Full host-agnostic steps (including Railway/Fly.io alternatives) are in
[`DEPLOYMENT.md`](DEPLOYMENT.md).

## API reference

The backend auto-generates OpenAPI docs via drf-spectacular:
- **Swagger UI:** `/api/docs/`
- **Raw schema:** `/api/schema/`

High-level endpoint groups (all under `/api/v1/`):

| Area | Base path | Notes |
|---|---|---|
| Auth | `/auth/` | register, login, google, token/refresh, logout, me, change-password |
| Freelancer profiles | `/freelancers/profile/`, `/freelancers/{username}/` | own-profile CRUD, public view |
| Client profiles | `/clients/profile/`, `/clients/{username}/` | own-profile CRUD, public view |
| Portfolio | `/portfolio/`, `/freelancers/{username}/portfolio/` | own-item CRUD, public listing |
| Social links | `/social-links/` | authenticated CRUD |
| Shortlist | `/shortlist/` | client-only, list/create/delete |
| Search | `/freelancers/?search=&tags=&min_rate=&max_rate=&availability_status=&ordering=`, `/clients/?...` | public, filterable |
| Deals | `/deals/` | create/list/detail; actions: `propose`, `accept`, `sign`, `complete`, `cancel`, `apply`, `completion` (GET/POST), `messages` (GET/POST, multipart for attachments), `dispute` (GET/POST), `resolve-dispute` (POST), `proof` |
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
- **Portfolio image uploads need S3 configured in production** — without
  it, Render's ephemeral filesystem wipes them on every redeploy

## License

ISC
