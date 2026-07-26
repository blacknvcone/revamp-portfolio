# Portfolio Monorepo

Monorepo containing a Next.js portfolio website and a shared Payload CMS backend that serves multiple applications.

## Apps

- `apps/web` — Next.js portfolio (static export, deployed to Cloudflare Pages)
- `apps/cms` — Payload CMS 3.x (shared backend, deployed to K8s)

## Packages

- `packages/types` — Shared TypeScript types

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Shared Payload CMS (apps/cms)                                  │
│  cms.danipras.dev                                               │
│                                                                 │
│  Auth: Bifrost SSO (bifrost.danipras.dev) → Logto (auth.danipras.dev)
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Login flow:                                                 │ │
│  │   SPA → Bifrost /auth/login → Logto → Bifrost /auth/callback│ │
│  │   → Bifrost session cookie (.danipras.dev)                  │ │
│  │   → SPA calls /auth/token → Bifrost JWT                    │ │
│  │   → CMS validates via Bifrost JWKS                         │ │
│  │                                                             │ │
│  │ Admin SSO:                                                  │ │
│  │   /admin → "Login with SSO" → Bifrost /auth/login           │ │
│  │   → /admin/sso (reads Bifrost cookie, sets Payload JWT)     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Landing page: / (minimal info + health check)                  │
│  Admin panel:  /admin (Payload CMS admin)                       │
│                                                                 │
│  Collections:                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │ Shared       │ │ Portfolio Web│ │ Monetalis                │ │
│  │ - Users(SSO) │ │ - Projects   │ │ - KprLoans               │ │
│  │ - Media      │ │ - Experience │ │ - RateTiers              │ │
│  │              │ │ - Skills     │ │ - Schedule               │ │
│  │              │ │ - Education  │ │ - ExtraPmts              │ │
│  │              │ │ - Certif.    │ │ - Reminders              │ │
│  │              │ │ - Profile(G) │ │ - Simulations            │ │
│  │              │ │              │ │ - Goals                  │ │
│  │              │ │              │ │ - MonetalisUsers         │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
│                                                                 │
│  Custom Endpoints:                                              │
│  - /api/auth/bifrost-admin — SSO login for CMS admin            │
│  - /api/internal/user-loan — Bifrost→CMS user lookup            │
│  - /api/kpr/* — KPR status, simulate, insights, seed, email    │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API
                ┌────────────┼─────────────┐
                │            │             │
          ┌─────▼─────┐ ┌───▼────┐ ┌─────▼─────┐
          │ Portfolio  │ │Monetalis│ │ Future    │
          │ Web        │ │ Web     │ │ Apps      │
          │ Next.js    │ │ Vite    │ │           │
          └───────────┘ └────────┘ └───────────┘
```

## Auth Architecture

### Single Auth Chain: Logto → Bifrost → CMS

All authentication flows through Bifrost (Go BFF). CMS validates Bifrost JWTs via JWKS. No direct Logto token validation in CMS.

**Bifrost JWT claims:**
```json
{
  "sub": "logto-user-id",
  "email": "user@example.com",
  "loanId": "kpr-loan-id",
  "role": "admin|viewer",
  "logtoRoles": ["cms-admin", "cms-editor", "monetalis-admin"],
  "iss": "bifrost"
}
```

**Monetalis SPA login flow:**
1. SPA → `Bifrost /auth/login` → Logto OIDC → Bifrost callback → session cookie
2. SPA → `Bifrost /auth/token` → raw JWT
3. SPA → CMS API with `Authorization: Bearer <jwt>`
4. CMS validates via Bifrost JWKS, enforces loan-scoped access

**CMS admin login flow:**
1. Admin panel → "Login with SSO" → `Bifrost /auth/login?redirect_to=cms.danipras.dev/admin/sso`
2. After Logto auth → redirect to `/admin/sso`
3. Server reads Bifrost session cookie → validates JWT → checks `logtoRoles` for `cms-admin`/`cms-editor`
4. Find/create user in `users` collection → set Payload JWT cookie → redirect to `/admin`

**Internal service-to-service:**
- Bifrost → CMS: `Authorization: INTERNAL_AUTH_TOKEN` (static token)
- CMS validates via `/api/internal/user-loan` endpoint

## CMS Collections

### Shared (no group)
- `users` — SSO-linked admin users (logtoSub, cmsRole, isActive). Created automatically on first SSO login. No password auth.
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
- `kpr-goals` — Savings goals
- `monetalis-users` — Monetalis dashboard users (logtoSub, loan, role). Managed via Bifrost SSO.

### Users Collection Access Control
```
read:  authenticated only (no public access)
create: disabled (auto-created via SSO flow)
update: admin only (cmsRole === 'admin')
delete: admin only (cmsRole === 'admin')
```

### Monetalis Collections Access Control
All Monetalis collections use Bifrost JWT-based loan-scoped access:
```
read:    authenticated, auto-filtered by user's loanId
create:  admin only, loan must match user's loanId
update:  admin only, existing doc must belong to user's loan
delete:  admin only, existing doc must belong to user's loan
```

## API Endpoints

### Auth Endpoints
- `POST /api/auth/bifrost-admin` — CMS admin SSO (validates Bifrost JWT, checks Logto roles, issues Payload JWT)

### Internal Endpoints
- `GET /api/internal/user-loan?logtoSub=xxx` — Bifrost→CMS user lookup (INTERNAL_AUTH_TOKEN required)

### KPR Endpoints (Monetalis)
- `GET /api/kpr/status` — Current KPR status (computed from loan + schedule + tiers)
- `POST /api/kpr/simulate/early-payoff` — Early payoff simulation with penalty calc
- `POST /api/kpr/simulate/extra-payment` — Extra payment impact simulation
- `GET /api/kpr/insights` — Financial insights & milestones
- `POST /api/kpr/seed` — Seed KPR data (idempotent, marks paid entries)

### Email Endpoints
- `POST /api/kpr/send-payment-reminder` — Send to all users on loan
- `POST /api/kpr/send-monthly-insight` — Send to all users on loan
- `POST /api/kpr/send-payment-reminder-test` — Send to specific email
- `POST /api/kpr/send-monthly-insight-test` — Send to specific email

### Health
- `GET /api/health` — Health check

## Pages

- `/` — Landing page (system status, quick links)
- `/admin` — Payload CMS admin panel
- `/admin/sso` — SSO callback (reads Bifrost cookie, sets Payload JWT)

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
│           │   ├── Users.ts    # SSO-linked admin users
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
│           │       ├── KprGoals.ts
│           │       ├── MonetalisUsers.ts
│           │       └── index.ts
│           ├── endpoints/
│           │   ├── bifrost-admin-auth.ts  # SSO admin login
│           │   ├── kpr.ts                 # KPR custom endpoints
│           │   ├── kpr-email.ts           # Email endpoints
│           │   └── user-loan.ts           # Internal Bifrost→CMS lookup
│           ├── access/
│           │   └── monetalis.ts           # Loan-scoped access control
│           ├── middleware/
│           │   └── bifrost-jwt.ts         # Bifrost JWT validation
│           ├── app/
│           │   ├── page.tsx               # Landing page
│           │   └── (payload)/admin/sso/   # SSO callback route
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
- **Bifrost**: K8s (namespace: `bifrost`), domain: `bifrost.danipras.dev`
- **Logto**: K8s (namespace: `logto`), domain: `auth.danipras.dev`

### CMS CI/CD

```bash
# Deploy CMS (Bifrost must be deployed first if JWT claims changed)
git tag -a cms-v1.5.0 -m "SSO login via Bifrost, landing page" && git push origin cms-v1.5.0
```

Triggers: Docker build → Push GHCR → Rolling restart via webhook

### Bifrost CI/CD

```bash
# Deploy Bifrost (deploy BEFORE CMS if JWT claims changed)
cd ~/RavenProject/bifrost
git tag -a v1.1.0 -m "Add logtoRoles to JWT" && git push origin v1.1.0
```

## Adding a New Application

1. Create collection files in `apps/cms/src/collections/yourapp/`
2. Use `admin.group: 'YourApp'` for sidebar grouping
3. Register collections in `payload.config.ts`
4. Add custom endpoints in `apps/cms/src/endpoints/`
5. Add CORS domain in `payload.config.ts`
6. Run `pnpm generate:types:cms` to regenerate types
7. Build and deploy

## Environment Variables

### CMS (apps/cms)
```env
DATABASE_URI=mongodb+srv://...
PAYLOAD_SECRET=<random-secret>
PAYLOAD_PUBLIC_SERVER_URL=https://cms.danipras.dev
BIFROST_JWKS_URL=http://bifrost.bifrost.svc.cluster.local:3002/.well-known/jwks.json
INTERNAL_AUTH_TOKEN=<static-token-for-bifrost-calls>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASS=<app-password>
S3_BUCKET=<bucket>
S3_ACCESS_KEY_ID=<key>
S3_SECRET_ACCESS_KEY=<secret>
S3_ENDPOINT=<endpoint>
S3_PUBLIC_URL=<public-url>
```

### Bifrost (bifrost repo)
```env
BIFROST_URL=https://bifrost.danipras.dev
LOGTO_ENDPOINT=https://auth.danipras.dev
LOGTO_CLIENT_ID=<logto-app-id>
LOGTO_CLIENT_SECRET=<logto-secret>
CMS_URL=http://cms-payload-service.cms-payload.svc.cluster.local:80
INTERNAL_AUTH_TOKEN=<same-token-as-cms>
REDIS_URL=redis://redis.bifrost.svc.cluster.local:6379
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
JWT_EXPIRY=15
ALLOWED_ORIGINS=https://monetalis.danipras.dev,https://cms.danipras.dev
COOKIE_DOMAIN=danipras.dev
COOKIE_SECURE=true
```
