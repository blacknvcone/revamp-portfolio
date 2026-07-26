# Current Issue: SSO Login to CMS Admin Panel

## Status
FIXED — Bifrost v1.1.3 (being deployed)

## Root Cause
Logto OSS v1.25.0 includes the user's `roles` claim in the **access token** (the JWT sent to resource servers), **NOT** in the **ID token** (the JWT sent to the client/Bifrost).

Bifrost was extracting roles from the ID token:
```go
// OLD — ID token doesn't have "roles" claim in Logto
claims, _ := uc.validateIDToken(tokens.IDToken)
rolesRaw, _ := claims["roles"].([]interface{})
```

This always returned an empty `logtoRoles` array, causing the CMS to reject login with `error=no_cms_access` — even though the user had `cms-admin` role assigned in Logto.

## Fix
Bifrost now extracts roles from the **access token** payload instead:
```go
// NEW — access token has "roles" claim
accessClaims, _ := uc.decodeAccessToken(tokens.AccessToken)
rolesRaw, _ := accessClaims["roles"].([]interface{})
```

### Files changed
- `bifrost/internal/usecase/auth.go`

### Tags
- Bifrost: `v1.1.3` — extract roles from access token
- CMS: `cms-v1.5.6` — allow login when logtoRoles absent from old JWT

## What to verify after deploy
1. Wait for Bifrost CI to deploy `v1.1.3`
2. Login via SSO from `cms.danipras.dev`
3. Check Bifrost logs for `logtoRoles` in JWT claims
4. Verify admin panel loads

## Notes
- The `roles` scope is NOT needed in the Logto OIDC auth URL — roles are included in the access token by default
- The Logto admin "Scopes" menu does NOT show a `roles` scope — this is normal for Logto OSS v1.25.0