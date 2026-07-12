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
└─────────────────────┬───────────────────────────────┘
                      │ REST API
         ┌────────────┼─────────────┐
         │            │             │
   ┌─────▼─────┐ ┌───▼────┐ ┌─────▼─────┐
   │ Portfolio  │ │Monetalis│ │ Future    │
   │ Web        │ │ Web     │ │ Apps      │
   └───────────┘ └────────┘ └───────────┘
```

The CMS acts as a shared backend for multiple frontend applications. Collections are organized into admin groups for clean separation.

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
- `kpr-reminders` — Email reminder configuration
- `kpr-simulations` — Saved payment simulations

### Custom Endpoints (Monetalis)
- `GET /api/kpr/status` — Current KPR status (computed)
- `POST /api/kpr/simulate/early-payoff` — Early payoff simulation
- `POST /api/kpr/simulate/extra-payment` — Extra payment simulation
- `GET /api/kpr/insights` — Financial insights & milestones
- `POST /api/kpr/seed` — Seed KPR data (idempotent)
- `POST /api/kpr/send-reminder` — Trigger email reminder

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev          # Both apps
pnpm dev:web      # Portfolio web only
pnpm dev:cms      # CMS only
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
│           │   └── kpr.ts      # Custom KPR endpoints
│           └── payload.config.ts
├── packages/
│   └── types/                  # Shared types
├── .github/
│   └── workflows/              # CI/CD
├── turbo.json
└── pnpm-workspace.yaml
```

## Deployment

- **CMS**: K8s (namespace: `cms-payload`), domain: `cms.danipras.dev`
- **Portfolio Web**: Cloudflare Pages
- **Monetalis Web**: K8s (namespace: `monetalis`), domain: `monetalis.danipras.dev`

## Adding a New Application

To add a new frontend application that uses this shared CMS:

1. Create a new collection group in `apps/cms/src/collections/`
2. Add collection files with `admin.group: 'YourAppName'`
3. Register collections in `payload.config.ts`
4. Add custom endpoints if needed in `apps/cms/src/endpoints/`
5. Add your frontend domain to the CORS config
6. Build and deploy
