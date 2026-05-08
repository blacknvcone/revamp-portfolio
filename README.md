# Portfolio Monorepo

This is a monorepo containing a Next.js portfolio website and a Payload CMS backend.

## Apps

- `apps/web` — Next.js portfolio (static export, deployed to Cloudflare Pages)
- `apps/cms` — Payload CMS (deployed to k8s homelab)

## Packages

- `packages/types` — Shared TypeScript types

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

## Structure

```
revamp-portfolio/
├── apps/
│   ├── web/          # Next.js portfolio
│   └── cms/          # Payload CMS
├── packages/
│   └── types/        # Shared types
├── .github/
│   └── workflows/    # CI/CD
├── turbo.json        # Turborepo config
└── pnpm-workspace.yaml
```
