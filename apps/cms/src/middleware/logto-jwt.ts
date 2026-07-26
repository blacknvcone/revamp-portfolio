import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Payload } from 'payload';

/**
 * JWT Validation Middleware for Logto
 * Validates Logto access tokens (Custom JWT) directly via JWKS.
 * CMS uses this to verify incoming requests.
 */

const LOGTO_JWKS_URL =
  process.env.LOGTO_JWKS_URL || 'https://auth.danipras.dev/oidc/jwks';
const LOGTO_ISSUER =
  process.env.LOGTO_ISSUER || 'https://auth.danipras.dev/oidc';

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
  /** Monetalis-specific: loan ID from Custom JWT or CMS DB lookup */
  loanId?: string;
  /** Monetalis-specific: role from Custom JWT or CMS DB lookup */
  role?: string;
}

/**
 * Validate a Logto access token and return user claims.
 * Logto Custom JWT contains: sub, email, logtoRoles (array of role names).
 * May also contain loanId and role if Custom JWT webhook is configured.
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
    // Read from Custom JWT if present (Logto webhook injects these)
    loanId: (payload as any).loanId as string | undefined,
    role: (payload as any).role as string | undefined,
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

/**
 * Resolve full Monetalis user context.
 * First checks JWT claims for loanId/role (Custom JWT webhook).
 * Falls back to DB lookup in monetalis-users collection.
 *
 * Returns null if: no valid token, user not found, or user inactive.
 */
export async function resolveMonetalisUser(
  req: { headers: Headers },
  payload: Payload,
): Promise<(LogtoUser & { loanId: string; role: string }) | null> {
  const logtoUser = await extractLogtoUser(req);
  if (!logtoUser) return null;

  // If Custom JWT already has loanId and role, use them
  if (logtoUser.loanId && logtoUser.role) {
    return logtoUser as LogtoUser & { loanId: string; role: string };
  }

  // Fallback: look up from monetalis-users collection
  try {
    const result = await payload.find({
      collection: 'monetalis-users',
      where: { logtoSub: { equals: logtoUser.sub } },
      limit: 1,
      depth: 0,
    });

    if (result.docs.length === 0) return null;

    const monetalisUser = result.docs[0] as any;
    if (!monetalisUser.isActive) return null;

    const loanId =
      typeof monetalisUser.loan === 'object'
        ? monetalisUser.loan?.id
        : monetalisUser.loan;

    if (!loanId) return null;

    return {
      ...logtoUser,
      loanId,
      role: monetalisUser.role || 'viewer',
    };
  } catch {
    return null;
  }
}
