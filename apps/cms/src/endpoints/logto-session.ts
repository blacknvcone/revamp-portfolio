/**
 * Logto Session Endpoint
 *
 * GET /api/auth/logto-session
 *
 * Called by Monetalis SPA after Logto OIDC login.
 * Validates the Logto access token, resolves the monetalis user mapping,
 * and returns full user context (sub, email, loanId, role, logtoRoles).
 *
 * Replaces the old Bifrost /auth/me + /auth/token endpoints.
 */

import type { Endpoint, PayloadRequest } from 'payload';
import { resolveMonetalisUser } from '@/middleware/logto-jwt';

const logtoSessionHandler = async (req: PayloadRequest) => {
  try {
    const user = await resolveMonetalisUser(
      req as { headers: Headers },
      req.payload,
    );

    if (!user) {
      return Response.json(
        {
          error: 'Unauthorized',
          code: 'NO_VALID_TOKEN_OR_USER',
          message:
            'No valid Logto token or no active Monetalis user mapping found.',
        },
        { status: 401 },
      );
    }

    return Response.json({
      sub: user.sub,
      email: user.email,
      loanId: user.loanId,
      role: user.role,
      logtoRoles: user.logtoRoles,
    });
  } catch (err: any) {
    console.error('[Logto Session Error]', err);
    return Response.json(
      { error: err.message || 'Internal server error' },
      { status: 500 },
    );
  }
};

export const logtoSessionEndpoint: Endpoint = {
  path: '/auth/logto-session',
  method: 'get',
  handler: logtoSessionHandler,
};
