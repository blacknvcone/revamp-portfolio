// ============================================================
// Logto OIDC Authentication Endpoint
// Validates Logto ID token and issues Payload CMS JWT
// ============================================================

import type { PayloadRequest } from 'payload';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import jwt from 'jsonwebtoken';

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'https://auth.danipras.dev';

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

/**
 * POST /api/auth/logto
 *
 * Body: { idToken: string }
 *
 * Flow:
 * 1. Validate Logto ID token (signature, issuer)
 * 2. Extract email from token
 * 3. Find existing user in monetalis-users by email
 * 4. If not found, return error (admin must pre-create account with loan)
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

    // 2. Find existing user
    const existing = await req.payload.find({
      collection: 'monetalis-users',
      where: { email: { equals: email } },
      limit: 1,
    });

    if (existing.docs.length === 0) {
      // Admin must pre-create the account with loan assignment
      return Response.json(
        {
          error: 'Akun belum terdaftar. Hubungi admin untuk membuat akun terlebih dahulu.',
          code: 'ACCOUNT_NOT_FOUND',
          email,
          name,
        },
        { status: 404 },
      );
    }

    const user = existing.docs[0];

    if (!user.isActive) {
      return Response.json(
        { error: 'Akun tidak aktif. Hubungi admin.' },
        { status: 403 },
      );
    }

    // 3. Generate Payload JWT using the same secret + format as Payload
    const secret = req.payload.secret;
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        collection: 'monetalis-users',
      },
      secret,
      { expiresIn: '7d' },
    );

    const loanId = typeof user.loan === 'object' && user.loan !== null
      ? (user.loan as any).id
      : user.loan;

    return Response.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
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
