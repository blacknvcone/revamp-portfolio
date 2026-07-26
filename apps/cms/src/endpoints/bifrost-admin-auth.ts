// ============================================================
// Bifrost JWT Authentication for CMS Admin Users
// Validates Bifrost JWT (which carries Logto roles)
// and issues Payload CMS JWT for admin panel access.
// ============================================================

import type { PayloadRequest } from 'payload';
import { SignJWT } from 'jose';
import { extractBifrostUser } from '@/middleware/bifrost-jwt';

const JWT_SECRET = new TextEncoder().encode(
  process.env.PAYLOAD_SECRET || 'dev-secret-change-me',
);

// Logto roles that grant CMS admin panel access
const CMS_ACCESS_ROLES = ['cms-admin', 'cms-editor'];

/**
 * POST /api/auth/bifrost-admin
 *
 * Headers: Authorization: Bifrost JWT as Bearer token
 *
 * Flow:
 * 1. Validate Bifrost JWT (via JWKS)
 * 2. Check if user has CMS Logto roles
 * 3. Find or create user in Payload users collection
 * 4. Return Payload CMS JWT for admin panel
 */
const bifrostAdminAuthHandler = async (req: PayloadRequest) => {
  try {
    // 1. Extract Bifrost user from Authorization header
    const user = await extractBifrostUser(req as { headers: Headers });
    if (!user) {
      return Response.json(
        { error: 'Invalid or missing Bifrost token' },
        { status: 401 },
      );
    }

    // 2. Check if user has CMS Logto roles
    // Note: old Bifrost (< v1.1.0) doesn't include logtoRoles in JWT.
    // In that case, allow access if JWT is valid (user is authenticated).
    // When logtoRoles is present, enforce the role check.
    if (user.logtoRoles !== undefined) {
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
    const logtoRoles = user.logtoRoles;

    // 3. Find or create user in Payload users collection
    const existing = await req.payload.find({
      collection: 'users',
      where: { logtoSub: { equals: user.sub } },
      limit: 1,
    });

    let cmsUser;
    if (existing.docs.length > 0) {
      cmsUser = existing.docs[0];
    } else {
      // Auto-create CMS user from Bifrost profile
      const cmsRole =
        logtoRoles?.includes('cms-admin') === true ? 'admin' : 'editor';

      cmsUser = await req.payload.create({
        collection: 'users',
        data: {
          logtoSub: user.sub,
          email: user.email,
          name: user.email,
          cmsRole,
          isActive: true,
        } as any,
      });
    }

    // 4. Generate Payload CMS JWT
    const token = await new SignJWT({
      id: cmsUser.id,
      email: cmsUser.email,
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
        email: cmsUser.email,
        name: (cmsUser as any).name,
        cmsRole: (cmsUser as any).cmsRole,
        logtoRoles,
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
