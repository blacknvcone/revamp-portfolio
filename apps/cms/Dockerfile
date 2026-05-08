# syntax=docker/dockerfile:1

# -------------------------------
# Base stage
# -------------------------------
FROM node:22-alpine AS base
RUN npm install -g pnpm@10.10.0

# -------------------------------
# Dependencies stage
# -------------------------------
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/cms/package.json ./apps/cms/
COPY packages/types/package.json ./packages/types/

RUN pnpm install --frozen-lockfile

# -------------------------------
# Builder stage
# -------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/cms/node_modules ./apps/cms/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/cms ./apps/cms
COPY packages/types ./packages/types

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm --filter @portfolio/cms build

# Verify standalone output was generated
RUN ls -la /app/apps/cms/.next/standalone/apps/cms/ \
    && test -f /app/apps/cms/.next/standalone/apps/cms/server.js \
    || (echo "ERROR: standalone/server.js not found" && exit 1)

# -------------------------------
# Runner stage
# -------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the app directory from standalone (includes server.js, .next/, node_modules/)
COPY --from=builder --chown=nextjs:nodejs /app/apps/cms/.next/standalone/apps/cms ./apps/cms

# Copy shared .pnpm store so symlinks in apps/cms/node_modules resolve correctly
COPY --from=builder --chown=nextjs:nodejs /app/apps/cms/.next/standalone/node_modules ./node_modules

# Copy static assets (not included in standalone)
COPY --from=builder --chown=nextjs:nodejs /app/apps/cms/.next/static ./apps/cms/.next/static

# Remove any build-time .env so k8s secrets/env take precedence
RUN rm -f /app/apps/cms/.env

USER nextjs

EXPOSE 3001

ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/cms/server.js"]
