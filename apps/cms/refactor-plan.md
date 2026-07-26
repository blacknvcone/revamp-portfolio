# Refactor Plan: Remove BFF, Direct Logto Integration

## Overview
Remove Bifrost (Go BFF). CMS and Monetalis SPA validate Logto JWT directly.
Logto Custom JWT injects roles into access token. No middle layer.

## Current Architecture
```
Logto → Bifrost (OIDC + session + JWT) → CMS (validates Bifrost JWT)
                                       → Monetalis SPA (via Bifrost)
```

## Target Architecture
```
Logto (Custom JWT with roles) → CMS (validates Logto JWT via JWKS)
                               → Monetalis SPA (Logto SDK directly)
```

## Changes Required

### 1. Logto Configuration (admin UI)
- [ ] Configure Custom JWT to inject `logtoRoles` into access token
- [ ] Verify Logto session storage (PostgreSQL is fine, Redis not needed for Logto)

### 2. CMS Code Changes
- [ ] Update SSO callback: validate Logto JWT directly (not Bifrost JWT)
- [ ] Update custom auth strategy: validate Logto JWT via JWKS
- [ ] Update bifrost-admin-auth endpoint: validate Logto JWT
- [ ] Remove Bifrost-related env vars and code
- [ ] Add LOGTO_JWKS_URL env var
- [ ] Update payload.config.ts CORS (remove bifrost domain)

### 3. Monetalis SPA Changes
- [ ] Replace Bifrost auth with Logto SDK
- [ ] Update login flow to use Logto directly
- [ ] Update token management (Logto handles sessions)

### 4. GH Actions Workflows
- [ ] CMS: use tag version in image (not `latest`)
- [ ] Monetalis: use tag version in image (not `latest`)

### 5. Deployment
- [ ] Deploy CMS (tag + push)
- [ ] Deploy Monetalis (tag + push)
- [ ] Bifrost can be scaled down (not deleted yet)

## Not Doing (Skip)
- Logto Redis session storage (PostgreSQL is sufficient)
- Deleting Bifrost (scale to 0, keep manifests for rollback)
- M2M token setup (not needed with Custom JWT)
