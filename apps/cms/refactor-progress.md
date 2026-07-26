# Auth Refactor Progress Summary

## Date: 2026-07-26

## Completed

### 1. CMS Code Refactored (remove Bifrost dependency)
- `src/middleware/bifrost-jwt.ts` → `src/middleware/logto-jwt.ts`
  - Validates Logto JWT directly via JWKS (ES384)
  - Updated all imports across 7 files
- `src/app/sso/page.tsx` — validates Logto OIDC callback directly
  - Exchanges code for tokens via Logto /oidc/token
  - Validates access token via Logto JWKS
  - Checks logtoRoles for CMS access
  - Signs Payload JWT and sets cookie
- `src/app/page.tsx` — SSO login redirects to Logto directly
- `src/collections/Users.ts` — strategy renamed to 'logto-jwt'
- `src/endpoints/bifrost-admin-auth.ts` — uses Logto JWT validation
- `src/payload.config.ts` — removed bifrost.danipras.dev from CORS

### 2. GH Actions Workflows Updated
- `.github/workflows/build-cms.yml` — now pushes tag version as image tag
  - e.g., cms-v1.5.12 → image: ghcr.io/.../cms-payload:cms-v1.5.12
- `vates-monitalis/.github/workflows/deploy.yml` — same pattern
- Both use `printf` for webhook JSON (safe construction)
- Both pass YAML validation

### 3. TypeScript + Build Verified
- `npx tsc --noEmit` — clean
- `pnpm run build` — clean

## Pending (Manual Steps Required)

### A. Configure Logto Custom JWT via API (PRIORITY)
The Custom JWT feature injects logtoRoles into the access token.

Step 1: Get admin access token:
```bash
# First, create an M2M app in Logto admin (if not exists):
# 1. Go to https://admin-auth.danipras.dev
# 2. Applications → Create → Machine-to-Machine
# 3. Name: "logto-mgmt-api"
# 4. Grant "Logto Management API access" → select "All resources"
# 5. Note the Client ID and Client Secret

# Then get admin token:
curl -X POST https://auth.danipras.dev/oidc/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=<M2M_CLIENT_ID>&client_secret=<M2M_CLIENT_SECRET>&resource=https://default.logto.app/api"
```

Step 2: Configure Custom JWT:
```bash
ADMIN_TOKEN="<access_token_from_step_1>"

curl -X PUT https://auth.danipras.dev/api/configs/jwt-customizer/access-token \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "script": "const getCustomJwtClaims = async ({ token, context, environmentVariables }) => {\n  const roles = context.user?.roles ?? [];\n  return {\n    logtoRoles: roles.map((r) => r.name),\n    email: context.user?.primaryEmail ?? context.user?.email ?? null,\n  };\n};",
    "environmentVariables": {},
    "blockIssuanceOnError": false
  }'
```

OR via admin UI:
1. Go to https://admin-auth.danipras.dev
2. Developer → Custom JWT → User access token → Edit
3. Paste the function above
4. Save

### B. Create CMS Application in Logto (if not exists)
1. Go to https://admin-auth.danipras.dev
2. Applications → Create → Traditional Web App
3. Name: "CMS Admin"
4. Redirect URIs: https://cms.danipras.dev/sso
5. Post Sign-out URIs: https://cms.danipras.dev
6. Note the Client ID and Client Secret

### C. Add LOGTO_CLIENT_ID + LOGTO_CLIENT_SECRET to CMS K8s Secret
```bash
# Get client ID and secret from step B
kubectl patch secret cms-payload-secret -n cms-payload --type='json' -p='[
  {"op":"add","path":"/data/LOGTO_CLIENT_ID","value":"'$(echo -n '<CLIENT_ID>' | base64)'"},
  {"op":"add","path":"/data/LOGTO_CLIENT_SECRET","value":"'$(echo -n '<CLIENT_SECRET>' | base64)'"}
]'
```

Add env vars to CMS deployment:
```bash
kubectl patch deployment cms-payload -n cms-payload --type='json' -p='[
  {"op":"add","path":"/spec/template/spec/containers/0/env/-","value":{"name":"LOGTO_CLIENT_ID","valueFrom":{"secretKeyRef":{"name":"cms-payload-secret","key":"LOGTO_CLIENT_ID"}}}},
  {"op":"add","path":"/spec/template/spec/containers/0/env/-","value":{"name":"LOGTO_CLIENT_SECRET","valueFrom":{"secretKeyRef":{"name":"cms-payload-secret","key":"LOGTO_CLIENT_SECRET"}}}}
]'
```

### D. Commit + Push + Deploy CMS
```bash
cd /Users/raven/RavenProject/revamp-portfolio
git add -A
git commit -m "refactor: remove Bifrost, validate Logto JWT directly

- Rewrite SSO callback to handle Logto OIDC flow directly
- Rename bifrost-jwt.ts → logto-jwt.ts (validate via JWKS)
- Update all imports across codebase
- Landing page SSO button → Logto directly
- Remove bifrost from CORS
- Users collection: strategy renamed to logto-jwt
- GH Actions: tag-versioned images (sha + tag + latest)
"

git tag -a cms-v1.6.0 -m "refactor: remove Bifrost, Logto direct auth"
git push origin main
git push origin cms-v1.6.0
```

### E. Seed First User Mapping in CMS
After deploying, create the first access mapping:
```bash
# First, create a user in Logto and note the sub ID
# Then create mapping in CMS (bypass access control via local API or direct DB)
curl -X POST https://cms.danipras.dev/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "logtoSub": "<logto-user-sub-id>",
    "email": "admin@example.com",
    "name": "Admin",
    "isActive": true
  }'
```
Note: This requires Payload auth since create: () => false. May need direct DB insert.

### F. Scale Down Bifrost (after verifying CMS works)
```bash
kubectl scale deployment bifrost -n bifrost --replicas=0
```

## NOT Done (Requires Separate Work)
- Monetalis SPA migration to Logto SDK (not started)
- Bifrost deletion (scaled to 0 after verification)
