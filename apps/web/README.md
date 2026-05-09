# @portfolio/web

Next.js portfolio frontend. Fetches content from Payload CMS at build time and exports static HTML for Cloudflare Pages.

---

## Local Development

```bash
# From repo root
pnpm dev:web
# or
cd apps/web && pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Cloudflare Pages

Deployment is handled by **GitHub Actions** (`.github/workflows/deploy-web.yml`) using the official `cloudflare/pages-action`.

### Trigger

Push a tag matching `web-v*`:

```bash
git tag web-v1.0.0
git push origin web-v1.0.0
```

GitHub Actions will build the app and upload the static output to the **raven-portfolio** project on Cloudflare Pages.

---

## Required GitHub Secrets

Add these secrets in your GitHub repo:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret | How to get it |
|--------|---------------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → any domain overview → right sidebar **API** section |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → **My Profile** → **API Tokens** → **Create Token** → **Custom token** → Permission: `Account` → `Cloudflare Pages` → `Edit` |
| `NEXT_PUBLIC_CMS_URL` | Your Payload CMS public URL, e.g. `https://cms.danipras.dev` |
| `CMS_API_KEY` | Payload CMS API key for read-only access during build |

### Creating the Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → click your **profile icon** (top right) → **My Profile**
2. Go to the **API Tokens** tab → click **Create Token**
3. Scroll down to **Custom token** → click **Get started**
4. Fill in:
   - **Token name:** `GitHub Actions Pages Deploy`
   - **Permissions:**
     - `Account` → `Cloudflare Pages` → `Edit`
   - **Account Resources:** `Include` → your account
5. Click **Continue to summary** → **Create Token**
6. Copy the token and save it as the `CLOUDFLARE_API_TOKEN` secret in GitHub

---

## Build

```bash
# From repo root
pnpm --filter @portfolio/web build
```

Static export is written to `apps/web/out/`.

---

## Tech Stack

- Next.js 15 (App Router, Static Export)
- Tailwind CSS
- Framer Motion
- Lucide React
