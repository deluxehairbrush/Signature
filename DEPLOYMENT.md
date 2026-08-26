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

### 1.4 Media storage (portfolio image uploads)

Most PaaS hosts (Render free tier, Railway, etc.) have an **ephemeral
filesystem** — without object storage, uploaded portfolio images vanish on
the next deploy/restart. `django-storages` is already wired into
`backend/config/settings.py`: it uses S3-compatible object storage when
`AWS_STORAGE_BUCKET_NAME` is set, and falls back to local disk
(`backend/media/`) when it isn't — so this is opt-in, not required to get a
first deploy running, but do it before relying on portfolio images sticking
around.

**Cloudflare R2** (recommended — S3-compatible API, 10GB free, no egress
fees):

1. Cloudflare dashboard → **R2 Object Storage** → **Create bucket**. Name it
   (e.g. `signature-media`), any region.
2. Bucket → **Settings** → **Public access** → allow public read access (or
   connect a custom domain) so uploaded images are viewable without signed
   URLs — the app sets `AWS_QUERYSTRING_AUTH = False`, so it expects a
   public bucket. Note the public URL Cloudflare gives you (either the
   `r2.dev` subdomain or your custom domain).
3. Cloudflare dashboard → **R2** → **Manage API tokens** → **Create API
   token** → permissions: **Object Read & Write**, scoped to this bucket.
   Copy the **Access Key ID**, **Secret Access Key**, and the account's
   **S3 API endpoint** (`https://<account-id>.r2.cloudflarestorage.com`).
4. Set these env vars on the backend host (Render: same place as §1.3):
   ```bash
   AWS_STORAGE_BUCKET_NAME=signature-media
   AWS_ACCESS_KEY_ID=<R2 access key id>
   AWS_SECRET_ACCESS_KEY=<R2 secret access key>
   AWS_S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
   AWS_S3_REGION_NAME=auto
   AWS_S3_CUSTOM_DOMAIN=<the public bucket URL from step 2, no https://>
   ```
5. Redeploy the backend. Uploading a portfolio image should now return a
   URL pointing at the R2 domain, not the backend's own host.

Any other S3-compatible provider (AWS S3 itself, DigitalOcean Spaces,
Backblaze B2) works the same way — just point `AWS_S3_ENDPOINT_URL` at that
provider's endpoint (omit it entirely for real AWS S3, which doesn't need a
custom endpoint).

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
- [ ] Set up R2/S3 media storage (§1.4) before relying on portfolio image
      uploads in production — without it, uploads vanish on next deploy
- [ ] Google sign-in is live — needs `GOOGLE_OAUTH_CLIENT_ID` set on the
      backend and the deployed frontend URL added as an Authorized
      JavaScript origin on the Google Cloud OAuth client

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
