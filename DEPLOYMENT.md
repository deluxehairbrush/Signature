# Deployment guide

Two separate deployables. Deploy the backend first — the frontend needs
its live URL.

## 1. Backend (Django) — needs a real server host, not Vercel

Vercel's serverless functions can't run this: it needs a persistent
process, a real Postgres connection, and file storage for uploaded
portfolio images. Use Render, Railway, Fly.io, or a plain VPS. Steps below
are host-agnostic; Render/Railway both support this almost exactly as
written.

### 1.1 Provision Postgres

Create a managed Postgres instance. Note down: database name, user,
password, host, port. (`backend/docker-compose.yml` shows the exact same
shape locally if you want to sanity-check connection settings first.)

### 1.2 Deploy the Django app

- **Root/working directory:** `backend/`
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
  (gunicorn is already in `requirements.txt`)
- **Run once after each deploy with schema changes:**
  `python manage.py migrate`

A `Dockerfile` already exists at `backend/Dockerfile` if your host prefers
building from that instead of buildpacks.

### 1.3 Environment variables

```bash
SECRET_KEY=<generate a real random secret — do NOT reuse the dev-secret-key-not-for-production value>
DEBUG=False
ALLOWED_HOSTS=<your-backend-domain>,<any-other-host>

# Postgres — from step 1.1. Omit DB_ENGINE entirely (it defaults to postgres).
POSTGRES_DB=...
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_HOST=...
POSTGRES_PORT=5432

# Must be the frontend's real deployed URL — used for both CORS and as
# the target for AI proxy calls (apps.ai_integration).
FRONTEND_URL=https://your-frontend-domain.vercel.app
AI_SERVICE_URL=https://your-frontend-domain.vercel.app

JWT_ACCESS_TOKEN_LIFETIME=30
JWT_REFRESH_TOKEN_LIFETIME=7
```

Generate `SECRET_KEY` with:
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

### 1.4 Known gap — media storage

`MEDIA_ROOT` currently points at local disk (`backend/media/`). Most PaaS
hosts (Render free tier, Railway, etc.) have an **ephemeral filesystem** —
uploaded portfolio images will vanish on the next deploy/restart unless
you either:
- attach a persistent volume at `backend/media/`, or
- switch to S3-compatible storage (`django-storages` + an S3/R2/Spaces
  bucket) — not currently configured, would need adding to
  `backend/config/settings.py` and `requirements.txt`

Pick one before real users start uploading portfolio images.

### 1.5 Seed demo data (optional, for a populated first impression)

```bash
python manage.py seed_demo
```

### 1.6 Verify

- `https://your-backend-domain/api/docs/` — Swagger UI should load
- `https://your-backend-domain/api/v1/deals/open/` — should return
  `{"count":0,"next":null,"previous":null,"results":[]}` (or seeded data)

## 2. Frontend (Next.js) — Vercel

### 2.1 Import the project

In Vercel: **New Project → Import Git Repository** → select this repo.
Framework preset (Next.js) is auto-detected. Root directory: repo root
(leave as-is — `.vercelignore` already excludes `backend/`, the Streamlit
files, and test scripts from the upload).

### 2.2 Environment variables

Set these in the Vercel project's **Settings → Environment Variables**:

```bash
GROQ_API_KEY=<your Groq API key>
GROQ_MODEL=llama-3.3-70b-versatile   # optional, this is the default
NEXT_PUBLIC_API_URL=https://your-backend-domain/api/v1
```

`NEXT_PUBLIC_API_URL` must point at the backend from step 1 — set it
**after** the backend is live, then redeploy (env var changes require a
redeploy to take effect on already-built pages, since `NEXT_PUBLIC_*`
vars are baked in at build time).

### 2.3 Deploy

Vercel builds with `next build` automatically. No custom build command
needed.

### 2.4 Close the loop

Once both are live, go back to the backend's `FRONTEND_URL` /
`AI_SERVICE_URL` env vars (step 1.3) and update them to the real Vercel
URL if you used a placeholder, then redeploy the backend so CORS and the
AI proxy work correctly.

## 3. Post-deploy checklist

- [ ] Visit the frontend, sign up a real account, confirm it round-trips
      to the backend (check `/api/docs/` or the Django admin at
      `/admin/` — you'll need `python manage.py createsuperuser` on the
      backend to access that)
- [ ] Test AI deal summarization end-to-end (`/deals/new`) — confirms
      `GROQ_API_KEY` is set correctly
- [ ] Test `/browse` returns real search results — confirms
      `NEXT_PUBLIC_API_URL` is pointed correctly and CORS is open
- [ ] Decide on the media storage question (§1.4) before relying on
      portfolio image uploads in production
- [ ] Google OAuth is still stubbed (disabled button) — needs a real
      Google Cloud OAuth client ID/secret if you want that live

## 4. What's still local-only / not addressed here

- Custom domains — configure per-host after the above is working
- CI/CD (auto-deploy on push) — both Vercel and most Django hosts support
  this natively via their GitHub integration, not covered here
- Backups for the Postgres database — host-specific, set up separately

## 5. Troubleshooting: Docker Desktop crash on Windows

If `docker compose up` (or Docker Desktop itself) fails to start with an
error like:

```
starting services: initializing Inference manager: listening on
unix://...\Docker\run\dockerInference: remove ...\dockerInference:
The file cannot be accessed by the system.
```

This is a Docker Desktop bug on Windows in its "Docker AI / Ask Gordon"
inference-manager feature — it creates AF_UNIX socket files as NTFS
reparse points, and on some machines that reparse point gets corrupted
badly enough that **no Windows-native tool can delete it** (Explorer,
`del`, `rmdir`, PowerShell `Remove-Item`, even `robocopy /MIR` all fail
with the same "file cannot be accessed" / error 1920). It's not caused by
anything in this repo — anyone with that feature enabled on Windows can
hit it.

**Fix (do both — the cleanup unblocks the immediate crash, the setting
change stops it recurring):**

1. **Clean up the corrupted socket files.** Windows tools can't touch
   them, but WSL2 can (via its `/mnt/c/...` filesystem access, which
   sidesteps whatever is broken about the NTFS reparse point):
   ```powershell
   # Quit Docker Desktop first
   Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
   Get-Process | Where-Object { $_.ProcessName -like "*docker*" } | Stop-Process -Force -ErrorAction SilentlyContinue
   ```
   ```bash
   wsl -d Ubuntu-22.04 -- rm -f "/mnt/c/Users/<you>/AppData/Local/Docker/run/dockerInference" "/mnt/c/Users/<you>/AppData/Local/Docker/run/userAnalyticsOtlpHttp.sock"
   ```
   (Substitute your actual WSL distro name from `wsl -l -v`, and check
   `%LOCALAPPDATA%\Docker\run\` for any other stuck `.sock` files — delete
   those the same way.)

2. **Disable the feature so it doesn't recur.** Quit Docker Desktop, edit
   `%APPDATA%\Docker\settings-store.json`, set `"EnableDockerAI": false`,
   then restart Docker Desktop. (Or in the GUI once it's running:
   **Settings → Beta features** → turn off Docker AI / Ask Gordon.)

After both steps, Docker Desktop should start cleanly and
`docker compose up` in `backend/` will work as documented in §1.
