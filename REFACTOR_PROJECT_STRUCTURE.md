# Refactor Project Structure — Detailed Plan

## Overview

Refactor the existing Next.js portfolio into a **monorepo** with two apps:

| App | Description | Deploy Target |
|-----|-------------|---------------|
| `apps/web` | Next.js portfolio (existing) | Cloudflare Pages (static) via GitHub Actions |
| `apps/cms` | Payload CMS | k8s homelab (Docker/k8s) |

**Shared infrastructure:** MongoDB Atlas (cloud-hosted, used by Payload CMS)

---

## Phase 1 — Monorepo Setup

### 1.1 Tooling Choice
- Use **pnpm workspaces** as the package manager (lightweight, native workspace support)
- Use **Turborepo** for build orchestration (caching, task pipelines)

### 1.2 Root Structure
```
revamp-portfolio/               ← repo root
├── apps/
│   ├── web/                    ← existing Next.js app (moved here)
│   └── cms/                    ← new Payload CMS app
├── packages/
│   └── types/                  ← shared TypeScript types (Payload generated types)
├── .github/
│   └── workflows/
│       ├── ci.yml              ← lint + typecheck (web + cms)
│       └── build-cms.yml       ← build & push CMS image to Oracle OCIR on cms/** changes
├── turbo.json                  ← Turborepo pipeline config
├── pnpm-workspace.yaml         ← pnpm workspace definition
└── package.json                ← root package.json (scripts only)
```

### 1.3 Steps
1. Initialize root `package.json` with `private: true` and workspace scripts
2. Create `pnpm-workspace.yaml` pointing to `apps/*` and `packages/*`
3. Move all existing files into `apps/web/`
4. Update `apps/web/package.json` name to `@portfolio/web`
5. Configure `turbo.json` with `build`, `dev`, `lint` pipeline tasks
6. Install Turborepo as a root dev dependency

---

## Phase 2 — Web App: Cloudflare Pages (Static Export)

### 2.1 Deployment Strategy
Use **Cloudflare Pages Git Integration** — Cloudflare builds and deploys on their own infrastructure.
GitHub Actions is **not used** for the web build/deploy, preserving free CI minutes.

```
Local machine                  GitHub            Cloudflare Pages
──────────────────             ──────            ────────────────
pnpm build (validate) ──→   git push  ──────→  Cloudflare builds & deploys
(blocked if build fails)                        (free, Cloudflare infrastructure)
```

**One-time Cloudflare Pages setup (dashboard):**
- Connect GitHub repo to a new Cloudflare Pages project
- Framework preset: `Next.js (Static HTML Export)`
- Build command: `pnpm --filter @portfolio/web build`
- Build output directory: `apps/web/out`
- Root directory: `/` (monorepo root)

### 2.2 Next.js Static Export Config
Payload CMS will serve content via REST API. The web app fetches data at **build time** (SSG).

Required changes to `apps/web/next.config.mjs`:
```js
const nextConfig = {
  output: 'export',       // static HTML export
  images: {
    unoptimized: true,    // Cloudflare Pages does not run Next.js image optimizer
  },
};
```

### 2.3 Data Fetching Strategy
- All pages use `fetch()` at build time against the Payload CMS REST API
- No `getServerSideProps` or server components that require a Node.js runtime
- Dynamic routes (e.g. `/projects/[slug]`) must use `generateStaticParams()`
- **Until CMS is live:** keep hardcoded data in `apps/web` — replace with API calls after CMS is deployed

### 2.4 Environment Variables (web)
Set these in **Cloudflare Pages dashboard** (Settings → Environment Variables):
```
NEXT_PUBLIC_CMS_URL=https://cms.yourdomain.com   ← Payload CMS public URL
CMS_API_SECRET=<token>                            ← read-only API token for build
```

### 2.5 Pre-push Git Hook (local build gate)
Enforces that the build passes locally before any push reaches GitHub.

File: `.husky/pre-push`
```sh
pnpm --filter @portfolio/web build
```

If build fails → push is blocked. Cloudflare never receives broken code.

### 2.6 GitHub Actions (optional — lightweight only)
Reserved only for fast, non-build tasks triggered on push to `main`:
- Lint: `turbo lint`
- Typecheck: `turbo typecheck`

No build step. No deploy step. Runs in under 1 minute.

---

## Phase 3 — CMS: Payload Setup

### 3.1 Initialize Payload CMS (v3)
Payload v3 runs **on top of Next.js App Router** — no separate Express server needed.

```
apps/cms/
├── src/
│   ├── collections/            ← content type definitions
│   │   ├── Projects.ts
│   │   ├── Experiences.ts
│   │   ├── Skills.ts
│   │   └── Profile.ts
│   ├── app/                    ← Next.js App Router
│   │   ├── (payload)/          ← Payload admin UI routes (auto-generated)
│   │   └── my-route/           ← optional custom API routes
│   ├── payload.config.ts       ← main Payload config
│   └── payload-types.ts        ← auto-generated TypeScript types
├── Dockerfile
├── .env
└── package.json                ← name: @portfolio/cms
```

### 3.2 Content Collections

#### `Profile` (Global — single document)
| Field | Type | Description |
|-------|------|-------------|
| `name` | text | Full name |
| `headline` | text | Short tagline |
| `bio` | richText | About me section |
| `avatar` | upload | Profile photo |
| `socialLinks` | array | GitHub, LinkedIn, etc. |

#### `Projects`
| Field | Type | Description |
|-------|------|-------------|
| `title` | text | Project title |
| `slug` | text (unique) | URL slug |
| `description` | richText | Project description |
| `thumbnail` | upload | Preview image |
| `techStack` | array | Technologies used |
| `repoUrl` | text | GitHub link |
| `liveUrl` | text | Live demo link |
| `featured` | checkbox | Show on homepage |
| `publishedAt` | date | Sort order |

#### `Experiences`
| Field | Type | Description |
|-------|------|-------------|
| `company` | text | Company name |
| `logo` | upload | Company logo |
| `role` | text | Job title |
| `startDate` | date | Start date |
| `endDate` | date | End date (nullable = current) |
| `description` | richText | Role summary |

#### `Skills`
| Field | Type | Description |
|-------|------|-------------|
| `name` | text | Skill name |
| `category` | select | Frontend / Backend / DevOps / Other |
| `icon` | upload | Icon or SVG |

### 3.3 Payload Config
- **Database:** MongoDB via `@payloadcms/db-mongodb`
- **Auth:** Default Payload admin auth (email/password)
- **Media uploads:** Cloudflare R2 via `@payloadcms/storage-s3` (S3-compatible adapter)
- **CORS:** Allow origin of Cloudflare Pages domain
- **API:** REST enabled (used by web at build time), GraphQL optional

### 3.4 Environment Variables (cms)
```
DATABASE_URI=mongodb+srv://user:password@cluster.mongodb.net/portfolio_cms
PAYLOAD_SECRET=<random-secret>
PAYLOAD_PUBLIC_SERVER_URL=https://cms.yourdomain.com

# Cloudflare R2 (media uploads)
S3_BUCKET=<r2-bucket-name>
S3_ACCESS_KEY_ID=<r2-access-key-id>
S3_SECRET_ACCESS_KEY=<r2-secret-access-key>
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_PUBLIC_URL=https://<r2-public-domain-or-custom-domain>
```

---

## Phase 4 — Shared Types Package

### 4.1 `packages/types`
- Payload auto-generates TypeScript types from collections
- Export them from `packages/types/` so `apps/web` can import type-safe API responses
- Both `apps/web` and `apps/cms` reference `@portfolio/types`

---

## Phase 5 — CMS CI/CD: GitHub Actions → GHCR → k3s Homelab

### 5.1 Docker Image for CMS
- `apps/cms/Dockerfile` — multi-stage build (Node.js)
- Image pushed to **GitHub Container Registry (GHCR)** — free, unlimited public repos, no extra credentials needed for push

### 5.2 GitHub Actions — Build & Push CMS Image

File: `.github/workflows/build-cms.yml`

Triggers on tag push matching `cms-v*` (e.g. `git tag cms-v1.0.0 && git push origin cms-v1.0.0`).

```yaml
name: Build & Deploy CMS

on:
  push:
    branches: [main]
    paths:
      - 'apps/cms/**'
      - '.github/workflows/build-cms.yml'
      - 'packages/types/**'
      - 'package.json'
      - 'pnpm-lock.yaml'
      - 'turbo.json'
      - 'pnpm-workspace.yaml'

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}/cms-payload

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      image-tag: ${{ github.sha }}
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=,suffix=
            type=raw,value=latest

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/cms/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Trigger rolling restart via webhook
        run: |
          PAYLOAD='{"ref":"${{ github.ref }}","sha":"${{ github.sha }}"}'
          SIG="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "${{ secrets.WEBHOOK_SECRET }}" | awk '{print $2}')"
          curl -f -X POST https://deploy.danipras.dev/hooks/deploy-cms \
            -H "Content-Type: application/json" \
            -H "X-Hub-Signature-256: $SIG" \
            -d "$PAYLOAD"
```

**No registry secrets needed for push** — `GITHUB_TOKEN` is automatically injected by GitHub Actions and has `packages: write` permission when `permissions.packages: write` is set.

### 5.3 k3s Manifests

**CMS app manifests** (`apps/cms/infra/` in this repo):
```
apps/cms/infra/
├── namespace.yaml            ← namespace: cms-payload
├── secret.yaml               ← DATABASE_URI, PAYLOAD_SECRET, PAYLOAD_PUBLIC_SERVER_URL, S3_* (R2 credentials)
├── ghcr-pull-secret.yaml     ← docker-registry secret for GHCR image pull (uses GitHub PAT with read:packages)
├── deployment.yaml           ← uses imagePullSecrets + ghcr.io/blacknvcone/revamp-portfolio/cms-payload:latest
├── service.yaml              ← ClusterIP :80 → :3001
└── ingressroute.yaml         ← cms.danipras.dev (Traefik + letsencrypt)
```

**Shared webhook receiver** (`obelix/webhook-receiver/` in the obelix repo):
```
obelix/webhook-receiver/
├── namespace.yaml            ← namespace: github-webhook (general-purpose, shared by all apps)
├── rbac.yaml                 ← SA + ClusterRole for patching deployments in ANY namespace
├── secret.yaml               ← WEBHOOK_SECRET for HMAC verification
├── configmap.yaml            ← Python HTTP server (HMAC verify → k8s PATCH API)
├── deployment.yaml           ← python:3.11-slim on odin-vm, 10m CPU / 64Mi RAM
├── service.yaml              ← ClusterIP :80 → :9000
├── middleware.yaml           ← Traefik rate-limit middleware
└── ingressroute.yaml         ← deploy.danipras.dev/hooks (Traefik + letsencrypt + rate limit)
```

Note: MongoDB Atlas is an external cloud service — no k8s manifest needed. Only the `DATABASE_URI` (Atlas connection string) goes into `secret.yaml`.

### 5.4 CD Strategy — Generic Webhook Receiver (via existing Cloudflare Tunnel)

Since the homelab k3s API is not reachable from the internet, a lightweight **webhook receiver pod** runs inside the cluster (in the shared `github-webhook` namespace) and accepts inbound calls via the existing **Cloudflare Tunnel**. It is **generic** — one receiver handles rolling restarts for any app by reading `namespace` and `deployment` from the JSON payload.

```
GitHub Actions (ubuntu-latest)
  → builds image → pushes :latest + :<sha> to GHCR
  → POST https://deploy.danipras.dev/hooks/deploy  (via Cloudflare Tunnel)
       Payload: {"ref":"...","sha":"...","namespace":"cms-payload","deployment":"cms-payload"}
       Header:  X-Hub-Signature-256 HMAC

webhook-receiver pod (inside k3s, ~10m CPU / 64Mi RAM)
  → verifies HMAC signature against WEBHOOK_SECRET
  → reads namespace + deployment from JSON payload
  → PATCH k8s API: sets restartedAt annotation on the target deployment
  → rolling restart pulls new :latest image from GHCR
```

Resource overhead: ~10m CPU / 64Mi RAM (one persistent pod on `odin-vm`).

**Required GitHub Secrets:**

| Secret | Value | How to get |
|--------|-------|------------|
| `WEBHOOK_SECRET` | Random string (e.g. `openssl rand -hex 32`) | Generate once, share with `webhook-receiver-secret.yaml` |

**Required k3s Setup:**

1. **Create GitHub PAT for image pull** (Settings → Developer settings → Personal access tokens → Tokens (classic))
   - Scope: `read:packages`
   - Save the token value

2. **Create GHCR pull secret in k3s:**
   ```bash
   kubectl create secret docker-registry ghcr-pull-secret \
     --namespace=cms-payload \
     --docker-server=ghcr.io \
     --docker-username=blacknvcone \
     --docker-password=<YOUR_GITHUB_PAT> \
     --docker-email=<your-email>
   ```

3. **Reference `imagePullSecrets` in the CMS Deployment:**
   ```yaml
   spec:
     template:
       spec:
         imagePullSecrets:
           - name: ghcr-pull-secret
         containers:
           - name: cms-payload
             image: ghcr.io/blacknvcone/revamp-portfolio/cms-payload:latest
             imagePullPolicy: Always
   ```

---

## Migration Checklist

### Phase 1 — Monorepo Bootstrap
- [x] ✅ Add `pnpm-workspace.yaml` at root
- [x] ✅ Add root `package.json` (private, turbo scripts)
- [x] ✅ Install Turborepo (`pnpm add -Dw turbo`)
- [x] ✅ Add `turbo.json` pipeline config
- [x] ✅ Delete `yarn.lock`
- [x] ✅ Move existing app files into `apps/web/`
- [x] ✅ Rename package to `@portfolio/web`
- [x] ✅ Run `pnpm install` from root and verify lockfile generated
- [x] ✅ Verify `pnpm dev` works from root

### Phase 2 — Web App Static Export
- [x] ✅ Update `apps/web/next.config.mjs` with `output: 'export'` and `images.unoptimized: true`
- [x] ✅ Keep hardcoded data for now (CMS not live yet) — *superseded by Phase 4*
- [x] ✅ Test `pnpm --filter @portfolio/web build` produces `apps/web/out/` directory

### Phase 2 — Cloudflare Pages Setup (one-time, dashboard)
- [ ] Create Cloudflare Pages project
- [ ] Connect GitHub repo
- [ ] Set framework preset to `Next.js (Static HTML Export)`
- [ ] Set build command: `pnpm --filter @portfolio/web build`
- [ ] Set build output directory: `apps/web/out`
- [ ] Set root directory: `/`
- [ ] Add env vars in Cloudflare dashboard (`NEXT_PUBLIC_CMS_URL`, `CMS_API_SECRET`) — placeholder values until CMS is live
- [ ] Trigger a test deploy and verify site is live

### Phase 2 — Pre-push Git Hook
- [ ] Install Husky (`pnpm add -Dw husky`)
- [ ] Initialize Husky (`pnpm exec husky init`)
- [ ] Create `.husky/pre-push` with `pnpm --filter @portfolio/web build`
- [ ] Test that a broken build blocks the push

### Phase 2 — GitHub Actions (lint/typecheck only)
- [ ] Create `.github/workflows/ci.yml` (lint + typecheck, no build/deploy)
- [ ] Verify it runs in under 1 minute

### Phase 3 — CMS Setup
- [x] ✅ Initialize `apps/cms` with Payload v3 (manually scaffolded; `create-payload-app` had Node.js compatibility issues)
- [x] ✅ Swap PostgreSQL adapter for MongoDB: replaced `@payloadcms/db-postgres` with `@payloadcms/db-mongodb` in `apps/cms/package.json`
- [x] ✅ Update `payload.config.ts` to use `mongooseAdapter` from `@payloadcms/db-mongodb`
- [x] ✅ Add Cloudflare R2 upload adapter: installed `@payloadcms/storage-s3` and configured in `payload.config.ts`
- [x] ✅ Define all collections (`Profile`, `Projects`, `Experiences`, `Skills`) — plus `Users`, `Media`, `Educations`, `Certifications`
- [x] ✅ Set CORS to allow Cloudflare Pages domain (uses `PAYLOAD_PUBLIC_SERVER_URL` env var)
- [x] ✅ Remove PostgreSQL from `docker-compose.yml` (no local DB needed — Atlas used directly in local dev too)
- [x] ✅ Update `.env.example` with MongoDB Atlas URI and R2 env vars
- [x] ✅ Test local CMS runs at port 3001 with `pnpm dev`

### Phase 4 — Web ↔ CMS Integration
- [x] ✅ Import Payload types directly from `@portfolio/cms` in `apps/web` — *adapted: created `packages/types` workspace instead (web app is JS)*
- [x] ✅ Replace hardcoded data in `apps/web` pages with Payload REST API `fetch()` calls
- [x] ✅ Add `generateStaticParams()` to all dynamic routes (`/projects/[slug]`)
- [x] Update Cloudflare dashboard env vars with real CMS URL and API token
- [x] ✅ Validate full static build fetches all content correctly

### Phase 5 — CMS CI/CD + k3s (GHCR)

**CI — GitHub Actions (`build-cms.yml`):**
- [x] ✅ Write `apps/cms/Dockerfile` (multi-stage Node.js build)
- [x] ✅ Create `.github/workflows/build-cms.yml` (build → push to GHCR → trigger webhook)
- [x] ✅ Update `build-cms.yml`: switch from OCIR to GHCR (`GITHUB_TOKEN` auth, `ghcr.io/.../cms-payload` image)
- [x] ✅ Update deploy payload to include `namespace` + `deployment` for generic webhook receiver
- [x] ✅ Add GitHub Secret: `WEBHOOK_SECRET`
- [x] ✅ Test: push tag `cms-v1.0.0` → image appears in GHCR Packages → webhook fires → deployment restarts

**CMS k3s Manifests (`apps/cms/infra/`):**
- [x] ✅ Create `apps/cms/infra/` manifests (namespace, secret, ghcr-pull-secret, deployment, service, ingressroute) — no PVC (R2 used instead)
- [x] ✅ Fill in `secret.yaml` with real base64 values (MongoDB URI + R2 credentials) and apply
- [x] ✅ Generate `ghcr-pull-secret.yaml` via `kubectl create secret docker-registry` (use GitHub PAT with `read:packages`) and apply
- [x] ✅ Verify CMS is live at `cms.danipras.dev`

**Shared Webhook Receiver (`obelix/webhook-receiver/`):**
- [x] ✅ Move webhook-receiver manifests to `obelix` repo (shared infra, not app-specific)
- [x] ✅ Change namespace to `github-webhook` (general-purpose)
- [x] ✅ Upgrade RBAC: Role → ClusterRole + ClusterRoleBinding (can patch deployments in any namespace)
- [x] ✅ Update Python server to read `namespace` + `deployment` from JSON payload
- [x] ✅ Add Traefik rate-limit middleware
- [x] ✅ Fill in `secret.yaml` with generated `WEBHOOK_SECRET` and apply
- [x] ✅ Add `deploy.danipras.dev` route to Cloudflare Tunnel config
- [x] ✅ Apply webhook-receiver manifests: `kubectl apply -f webhook-receiver/`
- [x] ✅ Do end-to-end test: push tag `cms-v1.0.0` → image built → webhook fires → pod restarts with new image

---

## Local Development Setup (Target State)

```bash
# Start everything locally
pnpm install
# No docker compose needed — MongoDB Atlas is used directly (set DATABASE_URI in apps/cms/.env)
pnpm dev                      # runs web (port 3000) + cms (port 3001) via Turbo
```
