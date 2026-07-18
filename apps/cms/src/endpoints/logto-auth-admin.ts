// ============================================================
// Logto OIDC Authentication for CMS Admin Users
// Validates Logto ID token and issues Payload CMS JWT
// ============================================================

import type { PayloadRequest } from 'payload';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import jwt from 'jsonwebtoken';

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'https://auth.danipras.dev';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`${LOGTO_ENDPOINT}/oidc/jwks`),
    );
  }
  return jwks;
}

/**
 * POST /api/auth/logto-admin
 *
 * Body: { idToken: string }
 *
 * Flow:
 * 1. Validate Logto ID token
 * 2. Check if user has cms-admin or cms-editor role
 * 3. Find or create user in Payload users collection
 * 4. Return Payload JWT
 */
const logtoAdminAuthHandler = async (req: PayloadRequest) => {
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
    const name = (logtoPayload.name as string)
      || (logtoPayload.username as string)
      || email
      || '';

    if (!email) {
      return Response.json(
        { error: 'Logto token missing email claim' },
        { status: 400 },
      );
    }

    // 2. Check if user has CMS roles
    const roles = (logtoPayload.roles as string[]) || [];
    const hasCmsAccess = roles.some(r =>
      r === 'cms-admin' || r === 'cms-editor' || r === 'monetalis-admin'
    );

    if (!hasCmsAccess) {
      return Response.json(
        { error: 'Not authorized for CMS access. Required role: cms-admin or cms-editor.' },
        { status: 403 },
      );
    }

    // 3. Find or create user in Payload users collection
    const existing = await req.payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
    });

    let user;
    if (existing.docs.length > 0) {
      user = existing.docs[0];
    } else {
      // Auto-create CMS user from Logto profile
      user = await req.payload.create({
        collection: 'users',
        data: {
          email,
          name,
        } as any,
      });
    }

    // 4. Generate Payload JWT
    const secret = req.payload.secret;
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        collection: 'users',
      },
      secret,
      { expiresIn: '7d' },
    );

    return Response.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: (user as any).name || name,
        roles,
      },
    });
  } catch (err: any) {
    req.payload.logger.error({ err, msg: 'Logto admin auth failed' });
    return Response.json(
      { error: err.message || 'Internal server error' },
      { status: 500 },
    );
  }
};

export const logtoAdminEndpoints = [
  {
    path: '/auth/logto-admin',
    method: 'post' as const,
    handler: logtoAdminAuthHandler,
  },
];
