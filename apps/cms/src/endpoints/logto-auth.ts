// ============================================================
// Logto OIDC Authentication Endpoint
// Validates Logto ID token and issues Payload CMS JWT
// Reads roles and custom_data from Logto (no MongoDB query)
// ============================================================

import type { PayloadRequest } from 'payload';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import jwt from 'jsonwebtoken';

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'https://auth.danipras.dev';
const LOGTO_ADMIN_ENDPOINT = process.env.LOGTO_ADMIN_ENDPOINT || 'https://admin-auth.danipras.dev';
const LOGTO_M2M_CLIENT_ID = process.env.LOGTO_M2M_CLIENT_ID || 'm-default';
const LOGTO_M2M_CLIENT_SECRET = process.env.LOGTO_M2M_CLIENT_SECRET || '';

// Cache JWKS — rotated automatically by jose
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`${LOGTO_ENDPOINT}/oidc/jwks`),
    );
  }
  return jwks;
}

// Cache M2M token
let m2mTokenCache: { token: string; expiresAt: number } | null = null;

/**
 * Fetch a Machine-to-Machine token for the Logto Management API.
 * Cached until 60s before expiry.
 */
async function getM2MToken(): Promise<string> {
  if (m2mTokenCache && Date.now() < m2mTokenCache.expiresAt - 60_000) {
    return m2mTokenCache.token;
  }

  const resp = await fetch(`${LOGTO_ADMIN_ENDPOINT}/oidc/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: LOGTO_M2M_CLIENT_ID,
      client_secret: LOGTO_M2M_CLIENT_SECRET,
      resource: 'https://default.logto.app/api',
      scope: 'all',
    }).toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Failed to get M2M token: ${resp.status} ${text}`);
  }

  const data = await resp.json() as { access_token: string; expires_in: number };
  m2mTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

/**
 * Fetch user details from Logto Management API (roles + custom_data).
 * Used as fallback when ID token doesn't include these claims.
 */
async function fetchLogtoUser(userId: string): Promise<{
  roles: string[];
  customData: Record<string, unknown>;
  name: string;
}> {
  const token = await getM2MToken();

  // Fetch user details
  const userResp = await fetch(`${LOGTO_ADMIN_ENDPOINT}/api/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!userResp.ok) {
    throw new Error(`Failed to fetch Logto user: ${userResp.status}`);
  }

  const userData = await userResp.json() as {
    name?: string;
    customData?: Record<string, unknown>;
    identities?: Record<string, unknown>;
  };

  // Fetch user roles
  const rolesResp = await fetch(`${LOGTO_ADMIN_ENDPOINT}/api/users/${userId}/roles`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  let roles: string[] = [];
  if (rolesResp.ok) {
    const rolesData = await rolesResp.json() as Array<{ name: string }>;
    roles = rolesData.map(r => r.name);
  }

  return {
    roles,
    customData: userData.customData || {},
    name: userData.name || '',
  };
}

/**
 * Map Logto role names to Payload role.
 * monetalis-admin → 'admin', monetalis-viewer → 'viewer'
 */
function mapRole(logtoRoles: string[]): 'admin' | 'viewer' | null {
  if (logtoRoles.includes('monetalis-admin')) return 'admin';
  if (logtoRoles.includes('monetalis-viewer')) return 'viewer';
  return null;
}

/**
 * POST /api/auth/logto
 *
 * Body: { idToken: string }
 *
 * Flow:
 * 1. Validate Logto ID token (signature, issuer)
 * 2. Extract roles from token claims (or fetch from Management API)
 * 3. Extract custom_data.monetalis.loanId and isActive
 * 4. Check if user has monetalis-admin or monetalis-viewer role
 * 5. Return Payload JWT + user info
 */
const logtoAuthHandler = async (req: PayloadRequest) => {
  try {
    const body = await req.json?.() ?? {};
    const { idToken } = body;

    if (!idToken) {
      return Response.json(
        { error: 'Missing idToken' },
        { status: 400 },
      );
    }

    // 1. Validate Logto ID token
    let logtoPayload: Record<string, unknown>;
    try {
      const { payload: verifiedPayload } = await jwtVerify(
        idToken,
        getJWKS(),
        {
          issuer: `${LOGTO_ENDPOINT}/oidc`,
        },
      );
      logtoPayload = verifiedPayload;
    } catch (verifyErr: any) {
      return Response.json(
        { error: 'Invalid Logto token', detail: verifyErr.message },
        { status: 401 },
      );
    }

    const email = logtoPayload.email as string | undefined;
    const sub = logtoPayload.sub as string;

    if (!email) {
      return Response.json(
        { error: 'Logto token missing email claim' },
        { status: 400 },
      );
    }

    if (!sub) {
      return Response.json(
        { error: 'Logto token missing sub claim' },
        { status: 400 },
      );
    }

    // 2. Extract roles and custom_data from token or Management API
    let logtoRoles: string[] = [];
    let customData: Record<string, unknown> = {};
    let name = (logtoPayload.name as string) || email;

    // Try reading directly from ID token claims first
    if (Array.isArray(logtoPayload.roles)) {
      logtoRoles = logtoPayload.roles as string[];
    }
    if (logtoPayload.custom_data && typeof logtoPayload.custom_data === 'object') {
      customData = logtoPayload.custom_data as Record<string, unknown>;
    }

    // If roles or custom_data missing from token, fetch from Management API
    if (logtoRoles.length === 0 || Object.keys(customData).length === 0) {
      try {
        const logtoUser = await fetchLogtoUser(sub);
        if (logtoRoles.length === 0) {
          logtoRoles = logtoUser.roles;
        }
        if (Object.keys(customData).length === 0) {
          customData = logtoUser.customData;
        }
        if (!logtoPayload.name && logtoUser.name) {
          name = logtoUser.name;
        }
      } catch (fetchErr: any) {
        req.payload.logger.warn({ err: fetchErr, msg: 'Failed to fetch user from Logto Management API, using token claims only' });
      }
    }

    // 3. Map Logto role to Payload role
    const role = mapRole(logtoRoles);

    if (!role) {
      return Response.json(
        {
          error: 'Akses ditolak. Anda tidak memiliki role monetalis yang valid.',
          code: 'NO_VALID_ROLE',
          email,
          name,
          logtoRoles,
        },
        { status: 403 },
      );
    }

    // 4. Extract monetalis custom_data
    const monetalisData = (customData as any)?.monetalis || {};
    const loanId = monetalisData.loanId || null;
    const isActive = monetalisData.isActive !== undefined ? monetalisData.isActive : true;

    if (!isActive) {
      return Response.json(
        { error: 'Akun tidak aktif. Hubungi admin.' },
        { status: 403 },
      );
    }

    if (!loanId) {
      return Response.json(
        {
          error: 'Loan belum di-assign. Hubungi admin untuk meng-assign loan.',
          code: 'NO_LOAN_ASSIGNED',
          email,
          name,
        },
        { status: 404 },
      );
    }

    // 5. Generate Payload JWT using the same secret + format as Payload
    // Use sub (Logto user ID) as the id to maintain consistency
    const secret = req.payload.secret;
    const token = jwt.sign(
      {
        id: sub,
        email,
        collection: 'monetalis-users',
      },
      secret,
      { expiresIn: '7d' },
    );

    return Response.json({
      token,
      user: {
        id: sub,
        email,
        name,
        role,
        loan: loanId,
      },
    });
  } catch (err: any) {
    req.payload.logger.error({ err, msg: 'Logto auth failed' });
    return Response.json(
      { error: err.message || 'Internal server error' },
      { status: 500 },
    );
  }
};

export const logtoEndpoints = [
  {
    path: '/auth/logto',
    method: 'post' as const,
    handler: logtoAuthHandler,
  },
];
