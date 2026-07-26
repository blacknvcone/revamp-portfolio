// ============================================================
// Bifrost JWT Authentication for CMS Admin Users
// Validates Bifrost JWT (which carries Logto roles)
// and issues Payload CMS JWT for admin panel access.
//
// Roles are managed in the identity provider (Logto/Kratos).
// CMS trusts the roles from the Bifrost JWT directly.
// This endpoint just validates + issues a Payload JWT.
// ============================================================

import type { PayloadRequest } from 'payload';
import { SignJWT } from 'jose';
import { extractLogtoUser } from '@/middleware/logto-jwt';

const JWT_SECRET = new TextEncoder().encode(
  process.env.PAYLOAD_SECRET || 'dev-secret-change-me',
);

// Logto roles that grant CMS admin panel access
const CMS_ACCESS_ROLES = ['cms-admin', 'cms-editor'];

/**
 * POST /api/auth/bifrost-admin
 *
 * Headers: Authorization: Bearer <Bifrost JWT>
 *
 * Flow:
 * 1. Validate Bifrost JWT (via JWKS)
 * 2. Check if user has CMS Logto roles (from JWT claims)
 * 3. Look up or create access mapping in CMS
 * 4. Return Payload CMS JWT for admin panel
 */
const bifrostAdminAuthHandler = async (req: PayloadRequest) => {
  try {
    // 1. Extract Bifrost user from Authorization header
    const user = await extractLogtoUser(req as { headers: Headers });
    if (!user) {
      return Response.json(
        { error: 'Invalid or missing Bifrost token' },
        { status: 401 },
      );
    }

    // 2. Check roles from Bifrost JWT (roles come from Logto, not CMS)
    if (user.logtoRoles !== undefined && user.logtoRoles !== null) {
      const hasCmsAccess = user.logtoRoles.some((r: string) =>
        CMS_ACCESS_ROLES.includes(r),
      );
      if (!hasCmsAccess) {
        return Response.json(
          {
            error:
              'Not authorized for CMS access. Required role: cms-admin or cms-editor.',
          },
          { status: 403 },
        );
      }
    }

    // 3. Look up access mapping in CMS (NO user creation)
    const existing = await req.payload.find({
      collection: 'users',
      where: { logtoSub: { equals: user.sub } },
      limit: 1,
    });

    if (existing.docs.length === 0) {
      return Response.json(
        {
          error:
            'No CMS access mapping found. Contact admin to grant access.',
        },
        { status: 403 },
      );
    }

    const cmsUser = existing.docs[0];

    // 4. Generate Payload CMS JWT
    const token = await new SignJWT({
      id: cmsUser.id,
      email: user.email,
      collection: 'users',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    return Response.json({
      token,
      user: {
        id: cmsUser.id,
        email: user.email,
        name: (cmsUser as any).name,
        logtoRoles: user.logtoRoles,
      },
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message || 'Internal server error' },
      { status: 500 },
    );
  }
};

export const bifrostAdminEndpoints = [
  {
    path: '/auth/bifrost-admin',
    method: 'post' as const,
    handler: bifrostAdminAuthHandler,
  },
];
