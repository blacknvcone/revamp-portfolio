// ============================================================
// SSO Callback: reads Bifrost session cookie → calls
// /auth/token to get raw JWT → validates → creates CMS user
// → sets Payload JWT cookie → redirects to admin panel.
// ============================================================

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtVerify, createRemoteJWKSet, SignJWT } from 'jose';

const BIFROST_JWKS_URL =
  process.env.BIFROST_JWKS_URL ||
  'http://bifrost.bifrost.svc.cluster.local:3002/.well-known/jwks.json';
const BIFROST_URL =
  process.env.BIFROST_URL || 'https://bifrost.danipras.dev';
const PAYLOAD_SECRET =
  process.env.PAYLOAD_SECRET || 'dev-secret-change-me';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJWKS() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(BIFROST_JWKS_URL));
  return jwks;
}

const CMS_ACCESS_ROLES = ['cms-admin', 'cms-editor'];

export default async function SSOCallbackPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie?.value) {
    redirect('/?error=no_session');
  }

  try {
    // 1. Call Bifrost /auth/token to get the raw JWT
    const tokenRes = await fetch(`${BIFROST_URL}/auth/token`, {
      headers: {
        Cookie: `session=${sessionCookie.value}`,
      },
    });

    if (!tokenRes.ok) {
      console.error('[SSO Callback] Bifrost /auth/token failed:', tokenRes.status);
      redirect('/?error=token_failed');
    }

    const tokenData = await tokenRes.json();
    const bifrostJWT = tokenData.token;

    if (!bifrostJWT) {
      console.error('[SSO Callback] No token in Bifrost response');
      redirect('/?error=token_missing');
    }

    // 2. Validate the Bifrost JWT
    const { payload } = await jwtVerify(bifrostJWT, getJWKS(), {
      issuer: 'bifrost',
    });

    const sub = payload.sub as string;
    const rawEmail = payload.email as string | null | undefined;
    const email = rawEmail && rawEmail.includes('@') ? rawEmail : `${sub}@cms.danipras.dev`;
    const logtoRoles: string[] | null | undefined = (payload as any).logtoRoles as string[] | null | undefined;

    // 3. Check CMS access roles
    // Note: old Bifrost (< v1.1.0) doesn't include logtoRoles in JWT.
    // In that case, allow access if JWT is valid (user is authenticated).
    // When logtoRoles is present, enforce the role check.
    if (logtoRoles != null) {
      const hasAccess = logtoRoles.some((r: string) =>
        CMS_ACCESS_ROLES.includes(r),
      );
      if (!hasAccess) {
        redirect('/?error=no_cms_access');
      }
    }

    // 4. Find or create user via Payload local API
    const { getPayload } = await import('payload');
    const config = (await import('@payload-config')).default;
    const payloadClient = await getPayload({ config });

    const existing = await payloadClient.find({
      collection: 'users',
      where: { logtoSub: { equals: sub } },
      limit: 1,
    });

    let userId: string;

    if (existing.docs.length > 0) {
      userId = existing.docs[0].id;
    } else {
      // Determine CMS role: if logtoRoles is present, derive from it
      const cmsRole =
        logtoRoles?.includes('cms-admin') === true ? 'admin' : 'editor';
      const newUser = await payloadClient.create({
        collection: 'users',
        data: {
          logtoSub: sub,
          email,
          name: email,
          cmsRole,
          isActive: true,
        } as any,
      });
      userId = newUser.id;
    }

    // 5. Generate Payload JWT
    const jwtSecret = new TextEncoder().encode(PAYLOAD_SECRET);
    const token = await new SignJWT({
      id: userId,
      email,
      collection: 'users',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(jwtSecret);

    // 6. Set cookie and redirect to admin
    cookieStore.set('payload-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    redirect('/admin');
  } catch (err: any) {
    console.error('[SSO Callback Error]', err);
    redirect('/?error=sso_failed');
  }
}