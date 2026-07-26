# Current Issue: Monetalis + Logto SSO + CMS Integration

## Status
FIXED — Bifrost removed from Monetalis SPA, direct Logto OIDC integration.

## Correct Architecture (Post-Refactor)

```
Logto (identity provider)
  → manages users, credentials, roles (cms-admin, cms-editor)
  → source of truth for WHO has access and WHAT level
  → OIDC authorization endpoint for both CMS admin + Monetalis SPA

Monetalis SPA (Vite + TanStack)
  → OIDC login directly with Logto via @logto/react SDK
  → Gets Logto access token (with resource param for CMS)
  → Calls CMS /api/auth/logto-session to resolve user context
  → Sends Bearer token on all CMS API requests

CMS (Payload 3.x)
  → Validates Logto access token via JWKS (jose library)
  → Resolves monetalis-users by logtoSub for loanId + role
  → Access control uses resolved user context for loan-scoping
  → Admin panel SSO via /sso page (direct OIDC with Logto)
```

### What lives where
| Concern | Where | Not here |
|---------|-------|----------|
| User identity | Logto | CMS |
| Passwords/MFA | Logto | CMS |
| Roles (cms-admin, cms-editor) | Logto | CMS |
| Monetalis roles (admin/viewer) | CMS monetalis-users | Logto |
| Loan assignment | CMS monetalis-users | Logto |
| Session management | @logto/react (browser) | CMS |
| JWT signing | Logto (access token) | CMS |
| Content management | CMS | Logto |

### Auth Flow: Monetalis SPA

1. User visits monetalis.danipras.dev
2. AuthProvider checks Logto session (`useLogto().isAuthenticated`)
3. If not authenticated → shows login button → `signIn(redirectUri)`
4. Logto authenticates → redirects to /callback
5. `useHandleSignInCallback()` exchanges code for tokens
6. AuthProvider calls `getAccessToken(cmsResource)` → Logto access token
7. AuthProvider calls CMS `GET /api/auth/logto-session` with Bearer token
8. CMS validates token via JWKS, looks up monetalis-users by sub
9. Returns `{ sub, email, loanId, role, logtoRoles }`
10. SPA stores user context, renders dashboard

### Auth Flow: CMS Admin Panel

1. User visits cms.danipras.dev/admin
2. Redirects to /sso if no payload-token cookie
3. /sso page does OIDC code exchange with Logto (server-side)
4. Validates ID token via JWKS
5. Looks up users collection by logtoSub
6. Signs Payload JWT → sets cookie → redirects to /admin

### CMS `monetalis-users` collection
- Maps logtoSub → loan (relationship to kpr-loans)
- Has role (admin/viewer) for Monetalis-specific permissions
- isActive flag for access revocation
- Users and CMS roles managed by Logto; Monetalis roles managed here

### CMS `users` collection
- Minimal mapping (logtoSub → Payload internal ID)
- Required by Payload 3.x for admin panel auth
- Custom auth strategy validates Payload JWT from cookie

## Environment Variables

### Monetalis SPA (.env)
```
VITE_LOGTO_ENDPOINT=https://auth.danipras.dev
VITE_LOGTO_APP_ID=<logto-spa-app-id>
VITE_LOGTO_REDIRECT_URI=https://monetalis.danipras.dev/callback
VITE_LOGTO_POST_LOGOUT_URI=https://monetalis.danipras.dev
VITE_CMS_URL=https://cms.danipras.dev
```

### CMS (.env)
```
LOGTO_JWKS_URL=https://auth.danipras.dev/oidc/jwks
LOGTO_ISSUER=https://auth.danipras.dev
LOGTO_CLIENT_ID=<logto-m2m-app-id>
LOGTO_CLIENT_SECRET=<logto-m2m-secret>
PAYLOAD_SECRET=<payload-jwt-secret>
```

## Deployment Checklist

### Logto
1. Create SPA application for Monetalis (public client, PKCE)
2. Configure redirect URI: https://monetalis.danipras.dev/callback
3. Configure post-logout URI: https://monetalis.danipras.dev
4. Add API resource for CMS (https://cms.danipras.dev)
5. Configure Custom JWT to inject logtoRoles (optional — DB fallback exists)

### CMS
1. Ensure monetalis-users collection has mapping records
2. Tag + push → GH Actions → GHCR → webhook restart

### Monetalis SPA
1. Set VITE_LOGTO_APP_ID in K8s deployment env
2. Tag + push → GH Actions → GHCR → webhook restart

### Seed access mapping
1. Create user in Logto (identity provider)
2. Create mapping in CMS monetalis-users:
   ```json
   POST /api/monetalis-users
   {
     "logtoSub": "<logto-sub-id>",
     "email": "user@example.com",
     "name": "User Name",
     "loan": "<kpr-loans-id>",
     "role": "admin",
     "isActive": true
   }
   ```

## Tags
- CMS: (pending — deploy after merge)
- Monetalis SPA: (pending — deploy after merge)
- Bifrost: DEPRECATED — can be decommissioned after Monetalis SPA deploy
