# Current Issue: SSO Login to CMS Admin Panel

## Status
DEBUGGING — Bifrost v1.2.0 deployed with Echo + slog

## Problem
When logging in via SSO from `cms.danipras.dev`, the SSO callback at `/sso` fails.

### Observed Errors (in sequence)
1. `no_session` — Bifrost session cookie not sent to `cms.danipras.dev` (fixed: added Domain to cookies)
2. `no_cms_access` — `logtoRoles` null in JWT (fixed: decode access token instead of ID token)
3. `Cannot read properties of null` — `logtoRoles` is `null` not `undefined` (fixed: `!= null` check)
4. `The following field is invalid: Email` — Payload auth validates email format (fixed: `disableLocalStrategy: true`)
5. `The following field is invalid: email` — Payload still validates email on auth collections (CURRENT)

### Root Cause Investigation
- **Bifrost JWT** has `"email": ""` and `"logtoRoles": null`
- **Logto ID token** doesn't include `email` claim (email may not be verified in Logto)
- **Logto access token** doesn't include `roles` claim in expected format
- Debug logging added in v1.1.6, now using Echo + slog in v1.2.0

### What to check next
1. Wait for Bifrost v1.2.0 to deploy
2. Logout from Bifrost, clear cookies, login again
3. Check Bifrost logs: `kubectl logs -n bifrost deploy/bifrost --tail=30 | grep -i "debug\|claims"`
4. The debug logs will show exact Logto ID token and access token claims
5. Verify Logto user has email verified and cms-admin role assigned

## Architecture (After Refactor)

### Bifrost v1.2.0
- **Framework**: Echo v4
- **Logging**: log/slog (JSON handler, structured)
- **Middleware**: Recover, RequestID, CORS
- **Routes**: /auth/login, /auth/callback, /auth/logout, /auth/me, /auth/refresh, /auth/token, /.well-known/jwks.json

### SSO Flow
```
Landing page → "Login with SSO"
  → Bifrost /auth/login?redirect_to=cms.danipras.dev/sso
  → Logto OIDC (PKCE)
  → Bifrost /auth/callback
    → exchange code for tokens
    → decode ID token claims (email, sub)
    → decode access token claims (roles)
    → get user loan from CMS
    → create Redis session
    → set session cookie on .danipras.dev
  → redirect to cms.danipras.dev/sso
  → CMS /sso page
    → read session cookie
    → call Bifrost /auth/token → get raw JWT
    → validate JWT
    → find/create CMS user
    → set payload-token cookie
    → redirect to /admin
```

## Tags
- Bifrost: v1.2.0 (Echo refactor)
- CMS: cms-v1.5.10 (disableLocalStrategy + text email field)