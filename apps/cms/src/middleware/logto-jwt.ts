import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * JWT Validation Middleware for Logto
 * Validates Logto access tokens (Custom JWT) directly via JWKS.
 * CMS uses this to verify incoming requests.
 */

const LOGTO_JWKS_URL =
  process.env.LOGTO_JWKS_URL || 'https://auth.danipras.dev/oidc/jwks';
const LOGTO_ISSUER =
  process.env.LOGTO_ISSUER || 'https://auth.danipras.dev';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(LOGTO_JWKS_URL));
  }
  return jwks;
}

export interface LogtoUser {
  sub: string;
  email: string;
  logtoRoles: string[];
  /** Monetalis-specific: loan ID from CMS mapping or Custom JWT */
  loanId?: string;
  /** Monetalis-specific: user role from CMS mapping or Custom JWT */
  role?: string;
}

/**
 * Validate a Logto access token and return user claims.
 * Logto Custom JWT contains: sub, email, logtoRoles (array of role names).
 * Algorithm: ES384 (EC P-384).
 */
export async function validateLogtoToken(token: string): Promise<LogtoUser> {
  const { payload } = await jwtVerify(token, getJWKS(), {
    issuer: LOGTO_ISSUER,
  });

  return {
    sub: payload.sub as string,
    email: (payload.email as string) || '',
    logtoRoles: (payload as any).logtoRoles as string[] || [],
  };
}

/**
 * Extract and validate Logto user from request.
 * Returns null if no valid token found.
 *
 * Accepts any object with a `headers` property (Request, PayloadRequest, etc.)
 */
export async function extractLogtoUser(
  req: { headers: Headers },
): Promise<LogtoUser | null> {
  // Try Authorization header first
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.replace('Bearer ', '');
      return await validateLogtoToken(token);
    } catch {
      return null;
    }
  }

  return null;
}
