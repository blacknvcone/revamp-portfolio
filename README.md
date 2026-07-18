# Portfolio Monorepo

Monorepo containing a Next.js portfolio website and a shared Payload CMS backend that serves multiple applications.

## Apps

- `apps/web` — Next.js portfolio (static export, deployed to Cloudflare Pages)
- `apps/cms` — Payload CMS 3.x (shared backend, deployed to K8s)

## Packages

- `packages/types` — Shared TypeScript types

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Shared Payload CMS (apps/cms)                      │
│  cms.danipras.dev                                   │
│                                                     │
│  Auth: Logto SSO (auth.danipras.dev)                │
│  ┌─────────────────────────────────────────────────┐│
│  │ /api/auth/logto      — Monetalis user SSO       ││
│  │ /api/auth/logto-admin — CMS admin SSO           ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  Collections:                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│  │ Shared       │ │ Portfolio Web│ │ Monetalis    ││
│  │ - Users      │ │ - Projects   │ │ - KprLoans   ││
│  │ - Media      │ │ - Experience │ │ - RateTiers  ││
│  │              │ │ - Skills     │ │ - Schedule   ││
│  │              │ │ - Education  │ │ - ExtraPmts  ││
│  │              │ │ - Certif.    │ │ - Reminders  ││
│  │              │ │ - Profile(G) │ │ - Simulations││
│  └──────────────┘ └──────────────┘ └──────────────┘│
│                                                     │
│  Custom Endpoints (Monetalis):                      │
│  - /api/kpr/status, simulate, insights, seed        │
│  - /api/kpr/send-payment-reminder                   │
│  - /api/kpr/send-monthly-insight                    │
│  - /api/kpr/send-*-test (per-user)                  │
└─────────────────────┬───────────────────────────────┘
                      │ REST API
         ┌────────────┼─────────────┐
         │            │             │
   ┌─────▼─────┐ ┌───▼────┐ ┌─────▼─────┐
   │ Portfolio  │ │Monetalis│ │ Future    │
   │ Web        │ │ Web     │ │ Apps      │
   │ Next.js    │ │ Vite    │ │           │
   └───────────┘ └────────┘ └───────────┘
```

## CMS Collections

### Shared (no group)
- `users` — Auth users with API key support
- `media` — File uploads (S3/Cloudflare R2)

### Portfolio Web group
- `projects` — Portfolio projects
- `experiences` — Work experience
- `skills` — Technical skills
- `educations` — Education history
- `certifications` — Professional certifications
- `profile` — Global profile data

### Monetalis group
- `kpr-loans` — KPR loan metadata (tab layout: Pinjaman, Dokumen, Aturan Penalti)
- `kpr-rate-tiers` — Stepped fixed interest rate tiers
- `kpr-schedule` — 240-month amortization schedule with payment tracking
- `kpr-extra-payments` — Extra payment log
- `kpr-reminders` — Email reminder config (day, types, multi-user)
- `kpr-simulations` — Saved payment simulations

> **Note:** Monetalis user management is now handled by Logto SSO.
> Users are no longer stored in CMS MongoDB. See [logto-sso](../logto-sso/).

### Auth Endpoints (Logto SSO)
- `POST /api/auth/logto` — Monetalis user SSO (validates Logto ID token, returns Payload JWT)
- `POST /api/auth/logto-admin` — CMS admin SSO (validates Logto token, auto-creates CMS user)

### Custom Endpoints (Monetalis)
- `GET /api/kpr/status` — Current KPR status (computed)
- `POST /api/kpr/simulate/early-payoff` — Early payoff simulation
- `POST /api/kpr/simulate/extra-payment` — Extra payment simulation
- `GET /api/kpr/insights` — Financial insights & milestones
- `POST /api/kpr/seed` — Seed KPR data (idempotent, marks paid entries)
- `POST /api/kpr/send-payment-reminder` — Send to all users on loan
- `POST /api/kpr/send-monthly-insight` — Send to all users on loan
- `POST /api/kpr/send-payment-reminder-test` — Send to specific email
- `POST /api/kpr/send-monthly-insight-test` — Send to specific email

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev          # Both apps
pnpm dev:web      # Portfolio web only
pnpm dev:cms      # CMS only

# Generate types after collection changes
pnpm generate:types:cms
```

## Structure

```
revamp-portfolio/
├── apps/
│   ├── web/                    # Next.js portfolio
│   │   └── src/
│   │       ├── app/            # Next.js app dir
│   │       ├── components/     # UI components
│   │       └── lib/            # CMS client
│   └── cms/                    # Payload CMS (shared)
│       └── src/
│           ├── collections/
│           │   ├── Users.ts    # Shared
│           │   ├── Media.ts    # Shared
│           │   ├── Profile.ts  # Portfolio group
│           │   ├── Projects.ts # Portfolio group
│           │   ├── ...
│           │   └── monetalis/  # Monetalis group
│           │       ├── KprLoans.ts
│           │       ├── KprRateTiers.ts
│           │       ├── KprSchedule.ts
│           │       ├── KprExtraPayments.ts
│           │       ├── KprReminders.ts
│           │       ├── KprSimulations.ts
│           │       └── index.ts
│           ├── endpoints/
│           │   ├── kpr.ts      # KPR custom endpoints
│           │   └── kpr-email.ts # Email endpoints
│           └── payload.config.ts
├── packages/
│   └── types/                  # Shared types
├── .github/
│   └── workflows/              # CI/CD
│       ├── build-cms.yml       # Triggered by cms-v* tags
│       ├── deploy-web.yml      # Triggered by web-v* tags
│       └── ci.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## Deployment

- **CMS**: K8s (namespace: `cms-payload`), domain: `cms.danipras.dev`
- **Portfolio Web**: Cloudflare Pages
- **Monetalis Web**: K8s (namespace: `monetalis`), domain: `monetalis.danipras.dev`

### CMS CI/CD

```bash
# Deploy CMS
git tag -a cms-v1.4.0 -m "release" && git push origin cms-v1.4.0
```

Triggers: Docker build → Push GHCR → Rolling restart via webhook

## Adding a New Application

1. Create collection files in `apps/cms/src/collections/yourapp/`
2. Use `admin.group: 'YourApp'` for sidebar grouping
3. Register collections in `payload.config.ts`
4. Add custom endpoints in `apps/cms/src/endpoints/`
5. Add CORS domain in `payload.config.ts`
6. Run `pnpm generate:types:cms` to regenerate types
7. Build and deploy
