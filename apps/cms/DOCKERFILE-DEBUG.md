# CMS Dockerfile — Build Issues & Resolution Log

> **Context:** This document tracks every Dockerfile failure we hit while setting up CI/CD for the CMS, what caused it, and why the fix works. If the build breaks again, read this first.

---

## Issue 1: `media` directory not found during build

### Error
```
failed to compute cache key: "/app/apps/cms/media": not found
```

### Root Cause
The Dockerfile tried to copy a `media` directory that does **not exist** in the repo:

```dockerfile
COPY --from=builder ... /app/apps/cms/media ./apps/cms/media
```

Payload CMS stores uploads in **Cloudflare R2** (S3), not local disk. The `media/` folder is only created at runtime when files are uploaded — it is not committed to git.

### Fix
Removed the `media` COPY line entirely.

```dockerfile
# REMOVED — R2 handles media, no local storage needed
# COPY --from=builder ... /app/apps/cms/media ./apps/cms/media
```

---

## Issue 2: `public` directory not found during build

### Error
```
failed to compute cache key: "/app/apps/cms/public": not found
```

### Root Cause
Same as above — the `public/` directory does not exist in `apps/cms/`. This is an admin-panel/API app with no static public assets.

### Fix
Removed the `public` COPY line entirely.

```dockerfile
# REMOVED — no public/ folder in this app
# COPY --from=builder ... /app/apps/cms/public ./apps/cms/public
```

---

## Issue 3: `Cannot find module '/app/apps/cms/server.js'` at runtime

### Error (pod crash)
```
Error: Cannot find module '/app/apps/cms/server.js'
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
```

### Root Cause
**Ambiguous Docker COPY semantics + Next.js standalone directory structure.**

Next.js `output: 'standalone'` produces a **nested** directory tree when the app lives inside a monorepo subdirectory (`apps/cms/`):

```
apps/cms/.next/standalone/
├── apps/
│   └── cms/
│       ├── server.js          ← entry point
│       ├── .next/             ← build manifest + server chunks
│       ├── node_modules/      ← symlinks to ../../node_modules/.pnpm/
│       ├── package.json
│       └── src/
└── node_modules/
    └── .pnpm/                 ← shared pnpm store (real files)
```

The original Dockerfile copied the **entire** `standalone` directory contents into `/app/`:

```dockerfile
COPY --from=builder .../standalone ./
```

This is supposed to copy the *contents* of `standalone/` into `/app/`, producing `/app/apps/cms/server.js`. In practice, BuildKit's interpretation of this copy (especially across stages) is ambiguous. The file either:
- Landed in the wrong path, or
- Was not copied at all because the directory-level COPY was resolved incorrectly.

### Why the local build was misleading
Running `next build` locally on macOS produced the same `standalone/` tree, so the *structure* was correct. The failure only manifested inside Docker because the **multi-stage COPY** did not replicate that tree exactly.

### Fix
Instead of copying the whole `standalone` directory ambiguously, copy the **two known paths explicitly**:

```dockerfile
# 1. The app directory (contains server.js, .next/, node_modules/)
COPY --from=builder --chown=nextjs:nodejs \
  /app/apps/cms/.next/standalone/apps/cms ./apps/cms

# 2. The shared .pnpm store so symlinks resolve correctly
COPY --from=builder --chown=nextjs:nodejs \
  /app/apps/cms/.next/standalone/node_modules ./node_modules

# 3. Static assets (never included in standalone)
COPY --from=builder --chown=nextjs:nodejs \
  /app/apps/cms/.next/static ./apps/cms/.next/static
```

**Key insight:** `standalone/apps/cms/node_modules/` contains **symlinks** like:
```
next → ../../../node_modules/.pnpm/next@15.4.11/.../next
```

If you only copy `standalone/apps/cms`, the symlinks break because `../../node_modules/.pnpm/` does not exist. You **must** also copy `standalone/node_modules/` (the `.pnpm` store) to the matching parent directory (`/app/node_modules/`).

---

## Issue 4: Build-time `.env` leaking into the image

### Root Cause
`standalone/apps/cms/.env` is generated during `next build` if a `.env` file exists in the builder stage. Even though `.dockerignore` excludes host `.env` files, Next.js creates one inside `standalone/` at build time.

If this file ships in the image, it overrides k8s environment variables at runtime because Node.js loads `.env` automatically.

### Fix
Delete the build-time `.env` after copying:

```dockerfile
RUN rm -f /app/apps/cms/.env
```

---

## Issue 5: `Cannot find module '/app/apps/cms/server.js'` — recurring at runtime

### Error (pod crash — same as Issue 3 but different root cause)

```
Error: Cannot find module '/app/apps/cms/server.js'
```

### Root Cause
`next.config.mjs` was missing `outputFileTracingRoot`. Without it, Next.js `output: 'standalone'` does not know the monorepo root and produces a **flat** standalone tree:

```
apps/cms/.next/standalone/
├── server.js          ← at the root of standalone
├── .next/
└── node_modules/
```

The Dockerfile expects the **nested** layout (`standalone/apps/cms/server.js`), which Next.js only generates when `outputFileTracingRoot` is set to the monorepo root.

### Fix
Added `outputFileTracingRoot` to `apps/cms/next.config.mjs`:

```js
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
};
```

With this set, Next.js traces files relative to the monorepo root and emits:

```
apps/cms/.next/standalone/
├── apps/cms/
│   └── server.js     ← matches Dockerfile COPY path
└── node_modules/.pnpm/
```

---

## Build verification added

A runtime check was added in the **builder** stage so the Docker build fails immediately if standalone output is missing, instead of producing a broken image:

```dockerfile
RUN ls -la /app/apps/cms/.next/standalone/apps/cms/ \
    && test -f /app/apps/cms/.next/standalone/apps/cms/server.js \
    || (echo "ERROR: standalone/server.js not found" && exit 1)
```

---

## Final Dockerfile structure

```
base      → installs pnpm globally
deps      → installs dependencies from lockfile (layer cache)
builder   → copies source + builds Next.js standalone
          → verifies server.js exists before continuing
runner    → copies only standalone output + static files
          → removes build-time .env
          → runs as non-root (nextjs:nodejs)
```

---

## How to verify a build before pushing

```bash
# 1. Build locally
docker build -f apps/cms/Dockerfile -t cms-payload:test .

# 2. Check that server.js exists inside the image
docker run --rm --entrypoint sh cms-payload:test -c \
  'ls -la /app/apps/cms/server.js'

# 3. Start the container locally (no env vars needed for smoke test)
docker run --rm -p 3001:3001 cms-payload:test
```

If step 2 fails, the COPY paths are still wrong — do not push the tag.

---

## Related files

| File | Purpose |
|------|---------|
| `apps/cms/Dockerfile` | Multi-stage build definition |
| `apps/cms/next.config.mjs` | Must contain `output: 'standalone'` |
| `.dockerignore` | Prevents host `node_modules`, `.env`, `.next` from polluting the build context |
