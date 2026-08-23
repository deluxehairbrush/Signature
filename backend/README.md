# Signature Backend

Proof-of-record and trust platform for freelancers and clients.

## Overview

Signature is a Django REST API backend that provides:

- **JWT Authentication** — register, login, token refresh
- **Freelancer & Client Profiles** — public profiles with reputation scores
- **Deal Management** — create, propose, accept, sign, complete deals with a controlled state machine
- **Proof-of-Record** — SHA-256 cryptographic hashes of finalized deal terms
- **Reputation System** — deterministic scoring based on deal outcomes and confirmations
- **Portfolio & Tags** — showcase work and filter by skills
- **AI Integration** — proxies to the existing Next.js AI service for contract extraction and red flag detection
- **Trust Badges** — public SVG and JSON reputation badges
- **Search & Discovery** — filtered search for freelancers and clients
- **Audit Logs** — tamper-evident event trail

## Architecture

```
┌──────────────────────┐
│   Next.js Frontend   │
│   (separate repo)    │
└──────────┬───────────┘
           │  REST / JWT
           ▼
┌──────────────────────┐
│   Django + DRF       │
│      Backend         │
├──────────────────────┤
│ Authentication       │
│ Profiles             │
│ Portfolio            │
│ Tags/Search          │
│ Deals                │
│ Signatures           │
│ Reputation           │
│ Proof of Record      │
│ Audit Logs           │
│ AI Integration       │
└───────┬────────┬─────┘
        │        │
   SQL  │        │ HTTP
        │        │
        ▼        ▼
  ┌──────────┐  ┌──────────────┐
  │PostgreSQL│  │ Existing AI  │
  │          │  │ Service      │
  └──────────┘  └──────────────┘
```

## Technology Stack

- Python 3.12+
- Django 5.1
- Django REST Framework 3.15
- PostgreSQL 16
- JWT (djangorestframework-simplejwt)
- drf-spectacular (OpenAPI docs)
- django-filter (search/filter)
- Pillow (image handling)

## Installation

### Local Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp env.example .env
# Edit .env with your values

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Seed demo data
python manage.py seed_demo

# Run development server
python manage.py runserver
```

### Docker

```bash
cd backend

# Start PostgreSQL and Django
docker compose up --build

# In another terminal, run migrations and seed
docker compose exec web python manage.py migrate
docker compose exec web python manage.py seed_demo
```

## PostgreSQL Configuration

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_DB` | `signature_db` | Database name |
| `POSTGRES_USER` | `signature_user` | Database user |
| `POSTGRES_PASSWORD` | `signature_pass` | Database password |
| `POSTGRES_HOST` | `localhost` | Database host |
| `POSTGRES_PORT` | `5432` | Database port |

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | Yes | dev key | Django secret key |
| `DEBUG` | No | `False` | Debug mode |
| `ALLOWED_HOSTS` | No | `localhost` | Comma-separated allowed hosts |
| `POSTGRES_DB` | Yes | `signature_db` | Database name |
| `POSTGRES_USER` | Yes | `signature_user` | Database user |
| `POSTGRES_PASSWORD` | Yes | `signature_pass` | Database password |
| `POSTGRES_HOST` | Yes | `localhost` | Database host |
| `POSTGRES_PORT` | No | `5432` | Database port |
| `FRONTEND_URL` | No | `http://localhost:3000` | CORS origin |
| `AI_SERVICE_URL` | No | `http://localhost:3000` | Existing AI service URL |
| `JWT_ACCESS_TOKEN_LIFETIME` | No | `30` | Access token lifetime in minutes |
| `JWT_REFRESH_TOKEN_LIFETIME` | No | `7` | Refresh token lifetime in days |

## API Endpoints

### Authentication
```
POST   /api/v1/auth/register/
POST   /api/v1/auth/login/
POST   /api/v1/auth/token/refresh/
POST   /api/v1/auth/logout/
GET    /api/v1/auth/me/
POST   /api/v1/auth/change-password/
```

### Freelancers
```
GET    /api/v1/freelancers/                           (search & filter)
GET    /api/v1/freelancers/{username}/                (public profile)
POST   /api/v1/freelancers/profile/                   (create)
PATCH  /api/v1/freelancers/profile/                   (update)
GET    /api/v1/freelancers/profile/completion/        (profile completion)
```

### Clients
```
GET    /api/v1/clients/                               (search & filter)
GET    /api/v1/clients/{username}/                    (public profile)
POST   /api/v1/clients/profile/                       (create)
PATCH  /api/v1/clients/profile/                       (update)
```

### Portfolio
```
GET    /api/v1/portfolio/
POST   /api/v1/portfolio/
PATCH  /api/v1/portfolio/{id}/
DELETE /api/v1/portfolio/{id}/
```

### Tags
```
GET    /api/v1/tags/
```

### Deals
```
GET    /api/v1/deals/
POST   /api/v1/deals/
GET    /api/v1/deals/{id}/
PATCH  /api/v1/deals/{id}/
POST   /api/v1/deals/{id}/accept/
POST   /api/v1/deals/{id}/sign/
POST   /api/v1/deals/{id}/complete/
POST   /api/v1/deals/{id}/cancel/
POST   /api/v1/deals/{id}/dispute/
GET    /api/v1/deals/{id}/proof/
GET    /api/v1/deals/{id}/completion/
POST   /api/v1/deals/{id}/completion/
```

### Reputation
```
GET    /api/v1/reputation/{username}/
```

### Badges
```
GET    /api/v1/badges/{username}/          (SVG)
GET    /api/v1/badges/{username}/json/     (JSON)
```

### AI
```
POST   /api/v1/ai/summarize-deal/
POST   /api/v1/ai/red-flags/
```

### Dashboard
```
GET    /api/v1/dashboard/freelancer/
GET    /api/v1/dashboard/client/
```

### Search
```
GET    /api/v1/freelancers/?search=python&tags=python,django&availability=AVAILABLE&min_rate=10&max_rate=50&min_reputation=70
GET    /api/v1/clients/?search=startup&industry=Technology
```

### Documentation
```
GET    /api/schema/       (OpenAPI schema)
GET    /api/docs/         (Swagger UI)
```

## Authentication Flow

1. **Register** → `POST /api/v1/auth/register/` with email, username, password
2. **Login** → `POST /api/v1/auth/login/` → returns access + refresh tokens
3. **Use API** → Include `Authorization: Bearer <access_token>` header
4. **Refresh** → `POST /api/v1/auth/token/refresh/` with refresh token
5. **Logout** → `POST /api/v1/auth/logout/` with refresh token

## AI Integration

The backend proxies AI requests to the existing Next.js AI service:

- `POST /api/v1/ai/summarize-deal/` → sends text to AI → returns structured deal data
- `POST /api/v1/ai/red-flags/` → sends deal data to AI → returns red flag analysis

The AI service URL is configured via `AI_SERVICE_URL` environment variable.

**Flow:**
1. User enters chat transcript or OCR text
2. Frontend sends to Django backend
3. Backend validates auth, proxies to AI service
4. AI returns structured JSON
5. Backend validates AI response with serializers
6. Returns normalized result to frontend

## Database Schema

Key entities:
- **User** — custom auth model (email-based)
- **FreelancerProfile** / **ClientProfile** — role-specific profiles
- **Tag** — reusable skill/category tags
- **PortfolioItem** — freelancer portfolio entries
- **Deal** — collaboration records with UUID public IDs
- **DealSnapshot** — immutable snapshot of deal terms at finalization
- **DealSignature** — SHA-256 proof-of-record signatures
- **CompletionConfirmation** — post-completion feedback from both parties
- **ReputationRecord** / **UserReputation** — deterministic reputation tracking
- **AuditLog** — event trail for important actions

## Security

- JWT authentication with access + refresh tokens
- Object-level permissions (only deal participants can access deal data)
- IP-based rate limiting (10 req/min for auth/AI, 30-60 for general)
- SHA-256 cryptographic proof hashes for deal signatures
- No passwords stored in plain text (Django's password hashing)
- CORS restricted to configured origins
- HSTS and secure headers in production
- File upload validation (10MB limit)

## Frontend Integration

The frontend team should:

1. Use JWT tokens from `/api/v1/auth/login/`
2. Include `Authorization: Bearer <token>` in all authenticated requests
3. Handle 401 responses by refreshing tokens
4. Use `/api/v1/auth/token/refresh/` to get new access tokens
5. Read OpenAPI docs at `/api/docs/` for complete schema

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=apps

# Run specific test file
pytest apps/accounts/tests/test_auth.py -v
```

## Seed Demo Data

```bash
python manage.py seed_demo
```

Creates:
- 5 freelancers with profiles, portfolio items, social links, tags
- 3 clients with profiles and tags
- 5 deals in various statuses (DRAFT, PROPOSED, ACCEPTED, ACTIVE, COMPLETED)
- Reputation scores
- Demo login: all emails in `seed_demo.py`, password: `demo1234`

## Assumptions & Limitations

1. The existing AI service must be running for AI endpoints to work
2. Profile pictures and portfolio images use local file storage in development
3. The badge system currently returns JSON; SVG generation is handled separately
4. Rate limiting is per-process (not shared across multiple server instances)
5. JWT tokens are not blacklisted across multiple server instances without Redis
