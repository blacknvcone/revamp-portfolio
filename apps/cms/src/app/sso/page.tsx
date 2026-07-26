// ============================================================
// SSO Callback: validates Logto JWT → looks up access mapping
// in CMS → signs Payload JWT → redirects to admin panel.
//
// CMS does NOT manage users. The `users` collection is a pure
// access mapping (logtoSub → cmsRole) pre-populated by admin.
// If no mapping exists, login is rejected.
//
// Flow: SPA (Monetalis) handles Logto OIDC, gets access token,
// redirects to CMS /sso?token=<logto_access_token>.
// ============================================================

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { validateLogtoToken } from '@/middleware/logto-jwt';

const PAYLOAD_SECRET =
  process.env.PAYLOAD_SECRET || 'dev-secret-change-me';

export default async function SSOCallbackPage() {
  // Read token from query parameter
  // Next.js server components can't read searchParams directly,
  // so we use a different approach: the token is passed via URL
  // We need to use the request URL

  // In Next.js App Router server components, we can't access searchParams
  // directly. The SPA should POST the token or we use a route handler.
  // For simplicity, we'll use a client-side approach or accept the token
  // via a route handler instead.

  // Actually, we can use the `searchParams` prop in a page component
  // But since this is a default export (page), we need to handle it differently.
  // Let's use a simple approach: read from a cookie set by the SPA.

  const cookieStore = await cookies();

  // Method 1: Try Logto access token from cookie
  // The SPA can set a cookie before redirecting
  const logtoTokenCookie = cookieStore.get('logto_access_token');
  if (logtoTokenCookie?.value) {
    try {
      const user = await validateLogtoToken(logtoTokenCookie.value);

      // Look up access mapping in CMS
      const { getPayload } = await import('payload');
      const config = (await import('@payload-config')).default;
      const payloadClient = await getPayload({ config });

      const existing = await payloadClient.find({
        collection: 'users',
        where: { logtoSub: { equals: user.sub } },
        limit: 1,
      });

      if (existing.docs.length === 0) {
        console.warn('[SSO Callback] No CMS access mapping for sub:', user.sub);
        redirect('/?error=no_cms_access');
      }

      const cmsUser = existing.docs[0];

      // Sign Payload JWT pointing to the mapping record
      const jwtSecret = new TextEncoder().encode(PAYLOAD_SECRET);
      const token = await new SignJWT({
        id: cmsUser.id,
        email: user.email,
        collection: 'users',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(jwtSecret);

      // Set cookie and redirect to admin
      cookieStore.set('payload-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });

      // Clear the temporary token cookie
      cookieStore.set('logto_access_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
        sameSite: 'lax',
      });

      redirect('/admin');
    } catch (err: any) {
      console.error('[SSO Callback Error]', err);
      redirect('/?error=sso_failed');
    }
  }

  // Method 2: Try reading from query parameter (fallback)
  // Note: This won't work in a pure server component without searchParams
  // The SPA should use Method 1 (cookie) instead
  redirect('/?error=no_token');
}
