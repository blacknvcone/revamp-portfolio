// ============================================================
// SSO Callback: reads Bifrost session cookie, validates JWT,
// finds/creates CMS user, sets Payload JWT cookie, redirects
// to admin panel.
// ============================================================

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtVerify, createRemoteJWKSet, SignJWT } from 'jose';

const BIFROST_JWKS_URL =
  process.env.BIFROST_JWKS_URL ||
  'http://bifrost.bifrost.svc.cluster.local:3002/.well-known/jwks.json';
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
    // No Bifrost session — redirect to landing page, not /admin
    redirect('/?error=no_session');
  }

  try {
    // 1. Validate Bifrost JWT
    const { payload } = await jwtVerify(sessionCookie.value, getJWKS(), {
      issuer: 'bifrost',
    });

    const sub = payload.sub as string;
    const email = payload.email as string;
    const logtoRoles = ((payload as any).logtoRoles as string[]) || [];

    // 2. Check CMS access roles
    const hasAccess = logtoRoles.some((r: string) =>
      CMS_ACCESS_ROLES.includes(r),
    );
    if (!hasAccess) {
      redirect('/?error=no_cms_access');
    }

    // 3. Find or create user via Payload local API
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
      const cmsRole = logtoRoles.includes('cms-admin') ? 'admin' : 'editor';
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

    // 4. Generate Payload JWT
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

    // 5. Set cookie and redirect to admin
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
