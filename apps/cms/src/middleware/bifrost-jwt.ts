import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * JWT Validation Middleware for Bifrost
 * Validates JWT tokens issued by Bifrost auth BFF.
 * CMS uses this to verify incoming requests.
 */

const BIFROST_JWKS_URL = process.env.BIFROST_JWKS_URL || 'http://bifrost.bifrost.svc.cluster.local:3002/.well-known/jwks.json';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(BIFROST_JWKS_URL));
  }
  return jwks;
}

export interface BifrostUser {
  sub: string;
  email: string;
  loanId: string;
  role: 'admin' | 'viewer';
}

/**
 * Validate a Bifrost JWT token and return user claims.
 */
export async function validateBifrostToken(token: string): Promise<BifrostUser> {
  const { payload } = await jwtVerify(token, getJWKS(), {
    issuer: 'bifrost',
  });

  return {
    sub: payload.sub as string,
    email: payload.email as string,
    loanId: (payload as any).loanId as string,
    role: (payload as any).role as 'admin' | 'viewer',
  };
}

/**
 * Extract and validate Bifrost user from request.
 * Returns null if no valid token found.
 *
 * Accepts any object with a `headers` property (Request, PayloadRequest, etc.)
 */
export async function extractBifrostUser(
  req: { headers: Headers },
): Promise<BifrostUser | null> {
  // Try Authorization header first
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.replace('Bearer ', '');
      return await validateBifrostToken(token);
    } catch {
      return null;
    }
  }

  // Try session cookie (for Bifrost→CMS internal calls)
  const cookies = req.headers.get('Cookie');
  if (cookies) {
    const sessionMatch = cookies.match(/session=([^;]+)/);
    if (sessionMatch) {
      try {
        return await validateBifrostToken(sessionMatch[1]);
      } catch {
        return null;
      }
    }
  }

  return null;
}
