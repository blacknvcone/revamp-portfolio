# Refactor Project Structure — Detailed Plan

## Overview

Refactor the existing Next.js portfolio into a **monorepo** with two apps:

| App | Description | Deploy Target |
|-----|-------------|---------------|
| `apps/web` | Next.js portfolio (existing) | Cloudflare Pages (static) via GitHub Actions |
| `apps/cms` | Payload CMS | k8s homelab (Docker/k8s) |

**Shared infrastructure:** PostgreSQL (managed in homelab, used by Payload CMS)

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
- **Database:** PostgreSQL via `@payloadcms/db-postgres`
- **Auth:** Default Payload admin auth (email/password)
- **Media uploads:** Local disk (PVC on k8s) or S3-compatible (optional, configurable)
- **CORS:** Allow origin of Cloudflare Pages domain
- **API:** REST enabled (used by web at build time), GraphQL optional

### 3.4 Environment Variables (cms)
```
DATABASE_URI=postgresql://user:password@postgres:5432/portfolio_cms
PAYLOAD_SECRET=<random-secret>
PAYLOAD_PUBLIC_SERVER_URL=https://cms.yourdomain.com
```

---

## Phase 4 — Shared Types Package

### 4.1 `packages/types`
- Payload auto-generates TypeScript types from collections
- Export them from `packages/types/` so `apps/web` can import type-safe API responses
- Both `apps/web` and `apps/cms` reference `@portfolio/types`

---

## Phase 5 — CMS CI/CD: GitHub Actions → Oracle OCIR → k8s Homelab

### 5.1 Docker Image for CMS
- `apps/cms/Dockerfile` — multi-stage build (Node.js)
- Image pushed to **Oracle Cloud Infrastructure Container Registry (OCIR)**

### 5.2 GitHub Actions — Build & Push CMS Image

File: `.github/workflows/build-cms.yml`

Triggers on push to `main` when changes detected under `apps/cms/**`.

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'apps/cms/**'
      - '.github/workflows/build-cms.yml'

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Log in to Oracle OCIR
        uses: docker/login-action@v3
        with:
          registry: ${{ secrets.OCI_REGION }}.ocir.io
          username: ${{ secrets.OCI_TENANCY_NAMESPACE }}/${{ secrets.OCI_USERNAME }}
          password: ${{ secrets.OCI_AUTH_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: apps/cms
          push: true
          tags: |
            ${{ secrets.OCI_REGION }}.ocir.io/${{ secrets.OCI_TENANCY_NAMESPACE }}/portfolio-cms:latest
            ${{ secrets.OCI_REGION }}.ocir.io/${{ secrets.OCI_TENANCY_NAMESPACE }}/portfolio-cms:${{ github.sha }}
```

**Required GitHub Secrets:**

| Secret | Value |
|--------|-------|
| `OCI_REGION` | e.g. `ap-singapore-1` |
| `OCI_TENANCY_NAMESPACE` | OCI tenancy object storage namespace |
| `OCI_USERNAME` | OCI user (e.g. `oracleidentitycloudservice/user@email.com`) |
| `OCI_AUTH_TOKEN` | OCI Auth Token (not password) — generate in OCI Console → User Settings |

### 5.3 k8s Manifests (in `obelix` repo)

```
obelix/
├── cms-payload/
│   ├── cms-payload-namespace.yaml      ← namespace: cms-payload
│   ├── cms-payload-secret.yaml         ← DATABASE_URI, PAYLOAD_SECRET, PAYLOAD_PUBLIC_SERVER_URL
│   ├── ocir-pull-secret.yaml           ← docker registry secret for OCIR image pull
│   ├── cms-payload-pvc.yaml            ← 10Gi NFS for Payload media uploads
│   ├── cms-payload-deployment.yaml     ← scheduled on heimdall-vm (more CPU/RAM headroom)
│   ├── cms-payload-service.yaml        ← ClusterIP :80 → :3000
│   └── cms-payload-ingressroute.yaml   ← cms.danipras.dev (Traefik + letsencrypt)
└── webhook-receiver/
    ├── webhook-receiver-rbac.yaml      ← SA + Role scoped to patch cms-payload deployment only
    ├── webhook-receiver-secret.yaml    ← WEBHOOK_SECRET for HMAC verification
    ├── webhook-receiver-configmap.yaml ← Python HTTP server (HMAC verify → k8s PATCH API)
    ├── webhook-receiver-deployment.yaml ← python:3.11-slim on odin-vm, 10m CPU / 64Mi RAM
    ├── webhook-receiver-service.yaml   ← ClusterIP :80 → :9000
    └── webhook-receiver-ingressroute.yaml ← deploy.danipras.dev/hooks (Traefik + letsencrypt)
```

Note: PostgreSQL already exists in homelab (`postgresql` namespace). No postgres manifest needed.

### 5.4 CD Strategy — Webhook Receiver (via existing Cloudflare Tunnel)

Since the homelab k8s API is not reachable from the internet, a lightweight **webhook receiver pod** runs inside the cluster and accepts inbound calls via the existing **Cloudflare Tunnel**. No self-hosted runner or GitOps controller needed.

```
GitHub Actions (ubuntu-latest)
  → builds image → pushes :latest + :<sha> to Oracle OCIR
  → POST https://deploy.danipras.dev/hooks/deploy-cms  (via Cloudflare Tunnel)
       with X-Hub-Signature-256 HMAC header

webhook-receiver pod (inside k8s, ~10m CPU / 64Mi RAM)
  → verifies HMAC signature against WEBHOOK_SECRET
  → PATCH k8s API: sets restartedAt annotation on cms-payload deployment
  → rolling restart pulls new :latest image from OCIR
```

Resource overhead: ~10m CPU / 64Mi RAM (one persistent pod on `odin-vm`).

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
- [x] ✅ Configure PostgreSQL adapter (`@payloadcms/db-postgres`)
- [x] ✅ Define all collections (`Profile`, `Projects`, `Experiences`, `Skills`) — plus `Users`, `Media`, `Educations`, `Certifications`
- [x] ✅ Set CORS to allow Cloudflare Pages domain (uses `PAYLOAD_PUBLIC_SERVER_URL` env var)
- [x] ✅ Set up local `docker-compose.yml` for Postgres dev database
- [x] ✅ Test local CMS runs at port 3001 with `pnpm dev`

### Phase 4 — Web ↔ CMS Integration
- [x] ✅ Import Payload types directly from `@portfolio/cms` in `apps/web` — *adapted: created `packages/types` workspace instead (web app is JS)*
- [x] ✅ Replace hardcoded data in `apps/web` pages with Payload REST API `fetch()` calls
- [x] ✅ Add `generateStaticParams()` to all dynamic routes (`/projects/[slug]`)
- [ ] Update Cloudflare dashboard env vars with real CMS URL and API token
- [x] ✅ Validate full static build fetches all content correctly

### Phase 5 — CMS CI/CD + k8s

**CI — GitHub Actions (`build-cms.yml`):**
- [x] ✅ Write `apps/cms/Dockerfile` (multi-stage Node.js build)
- [x] ✅ Create `.github/workflows/build-cms.yml` (build → push to Oracle OCIR → trigger webhook)
- [ ] Add GitHub Secrets: `OCI_REGION`, `OCI_TENANCY_NAMESPACE`, `OCI_USERNAME`, `OCI_AUTH_TOKEN`, `WEBHOOK_SECRET`
- [ ] Test: push to `main` → image appears in OCIR → webhook fires → deployment restarts

**k8s Manifests (`obelix` repo):**

- [x] ✅ Create `obelix/cms-payload/` manifests (namespace, secret, ocir pull secret, pvc, deployment, service, ingressroute)
- [x] ✅ Create `obelix/webhook-receiver/` manifests (rbac, secret, configmap, deployment, service, ingressroute)
- [ ] Fill in `cms-payload-secret.yaml` with real base64 values and apply
- [ ] Generate `ocir-pull-secret.yaml` via `kubectl create secret docker-registry` and apply
- [ ] Fill in `webhook-receiver-secret.yaml` with generated `WEBHOOK_SECRET` and apply
- [ ] Add `deploy.danipras.dev` route to Cloudflare Tunnel config
- [ ] Apply all manifests: `kubectl apply -f cms-payload/ && kubectl apply -f webhook-receiver/`
- [ ] Verify CMS is live at `cms.danipras.dev`
- [ ] Do end-to-end test: push to `main` → image built → webhook fires → pod restarts with new image

---

## Local Development Setup (Target State)

```bash
# Start everything locally
pnpm install
docker compose up -d          # Postgres for local CMS dev
pnpm dev                      # runs web (port 3000) + cms (port 3001) via Turbo
```

```
docker-compose.yml (root)
├── postgres   → port 5432
└── (cms runs via pnpm, not Docker, in local dev)
```
