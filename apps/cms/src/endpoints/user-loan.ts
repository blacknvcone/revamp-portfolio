import type { Endpoint } from 'payload';

const INTERNAL_AUTH_TOKEN = process.env.INTERNAL_AUTH_TOKEN || '';

/**
 * GET /api/monetalis-users/user-loan?logtoSub=xxx
 *
 * Internal endpoint called by Bifrost during login.
 * Validates internal token, looks up user by logtoSub, returns loanId + role.
 */
export const userLoanEndpoint: Endpoint = {
  path: '/monetalis-users/user-loan',
  method: 'get',
  handler: async (req) => {
    // Validate internal token (called by Bifrost)
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token || token !== INTERNAL_AUTH_TOKEN) {
      return Response.json(
        { error: 'Unauthorized', code: 'INVALID_INTERNAL_TOKEN' },
        { status: 401 },
      );
    }

    // Get logtoSub from query
    const query = (req.query as Record<string, string>) || {};
    const logtoSub = query.logtoSub;
    if (!logtoSub) {
      return Response.json(
        { error: 'Missing logtoSub parameter', code: 'MISSING_LOGTO_SUB' },
        { status: 400 },
      );
    }

    // Look up user by logtoSub
    const users = await req.payload.find({
      collection: 'monetalis-users',
      where: { logtoSub: { equals: logtoSub } },
      limit: 1,
      depth: 0,
    });

    if (users.docs.length === 0) {
      return Response.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 },
      );
    }

    const user = users.docs[0];

    // Check if user is active
    if (!user.isActive) {
      return Response.json(
        { error: 'User inactive', code: 'USER_INACTIVE' },
        { status: 403 },
      );
    }

    // Return minimal data for token claims
    return Response.json({
      loanId: (user.loan as any)?.id || user.loan,
      role: user.role || 'viewer',
    });
  },
};
