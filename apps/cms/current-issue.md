# Current Issue: SSO Login to CMS Admin Panel

## Status
REFACTORED — Roles in Logto, mapping in CMS, JWT carries claims.

## Correct Architecture

```
Logto (identity provider)
  → manages users, credentials, roles (cms-admin, cms-editor)
  → source of truth for WHO has access and WHAT level

Bifrost (BFF)
  → OIDC login via Logto
  → M2M token → Management API → gets user roles from Logto
  → issues JWT with: sub, email, logtoRoles[]

CMS
  → validates Bifrost JWT (JWKS)
  → trusts logtoRoles from JWT directly
  → users collection = minimal mapping (logtoSub → Payload ID)
  → Payload admin panel uses custom auth strategy (bifrost-jwt)
```

### What lives where
| Concern | Where | Not here |
|---------|-------|----------|
| User identity | Logto | CMS |
| Passwords/MFA | Logto | CMS |
| Roles | Logto | CMS |
| Session management | Bifrost | CMS |
| JWT signing | Bifrost | CMS |
| Content management | CMS | Logto/Bifrost |

### CMS `users` collection
- Payload 3.x requires `admin.user` for admin panel
- This collection is a **minimal mapping** (logtoSub → Payload internal ID)
- No `cmsRole` — roles come from the Bifrost JWT
- Custom auth strategy validates JWT from cookie

## Deployment Checklist

### Bifrost
1. Create M2M app in Logto admin (for role lookup)
2. Add K8s secrets + env vars
3. Tag + push

### CMS
1. Tag + push

### Seed access mapping
1. Create user in Logto (identity provider)
2. Create mapping in CMS via Payload local API:
   ```
   POST /api/users
   { "logtoSub": "<logto-sub-id>", "email": "...", "isActive": true }
   ```
   (Note: no cmsRole field — role comes from JWT)

## Tags
- Bifrost: v1.2.1 (M2M roles from Logto)
- CMS: cms-v1.5.12 (auth refactor — roles from JWT, mapping table only)
