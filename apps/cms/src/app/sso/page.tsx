// ============================================================
// SSO Callback: handles Logto OIDC callback directly.
//
// Flow:
// 1. Landing page redirects to Logto /oidc/auth
// 2. Logto authenticates user → redirects to /sso?code=xxx&state=xxx
// 3. CMS exchanges code for tokens via Logto /oidc/token
// 4. Validates ID token via Logto JWKS (has sub, email)
// 5. Looks up access mapping in CMS users collection
// 6. Signs Payload JWT and sets cookie → redirect to /admin
// ============================================================

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtVerify, createRemoteJWKSet, SignJWT } from 'jose';

const LOGTO_ENDPOINT =
  process.env.LOGTO_ENDPOINT || 'https://auth.danipras.dev';
const LOGTO_CLIENT_ID = process.env.LOGTO_CLIENT_ID || '';
const LOGTO_CLIENT_SECRET = process.env.LOGTO_CLIENT_SECRET || '';
const CMS_URL =
  process.env.PAYLOAD_PUBLIC_SERVER_URL || 'https://cms.danipras.dev';
const PAYLOAD_SECRET =
  process.env.PAYLOAD_SECRET || 'dev-secret-change-me';

const LOGTO_JWKS_URL = `${LOGTO_ENDPOINT}/oidc/jwks`;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJWKS() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(LOGTO_JWKS_URL));
  return jwks;
}

/** Exchange authorization code for tokens via Logto */
async function exchangeCodeForTokens(code: string): Promise<{
  id_token: string;
  access_token: string;
}> {
  const BasicAuth = Buffer.from(
    `${LOGTO_CLIENT_ID}:${LOGTO_CLIENT_SECRET}`,
  ).toString('base64');

  const res = await fetch(`${LOGTO_ENDPOINT}/oidc/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${BasicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${CMS_URL}/sso`,
      client_id: LOGTO_CLIENT_ID,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${body}`);
  }

  return res.json();
}

export default async function SSOCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; state?: string; error?: string }>;
}) {
  const params = await searchParams;
  const code = params.code;
  const error = params.error;

  if (error) {
    console.error('[SSO Callback] Logto returned error:', error);
    redirect(`/?error=logto_error:${error}`);
  }

  if (!code) {
    redirect('/?error=no_code');
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // 2. Validate ID token via Logto JWKS
    const { payload: idTokenPayload } = await jwtVerify(
      tokens.id_token,
      getJWKS(),
      { issuer: `${LOGTO_ENDPOINT}/oidc` },
    );

    const sub = idTokenPayload.sub as string;
    const email = (idTokenPayload.email as string) || '';

    if (!sub) {
      redirect('/?error=missing_sub');
    }

    // 3. Look up access mapping in CMS (NO user creation)
    const { getPayload } = await import('payload');
    const config = (await import('@payload-config')).default;
    const payloadClient = await getPayload({ config });

    const existing = await payloadClient.find({
      collection: 'users',
      where: { logtoSub: { equals: sub } },
      limit: 1,
    });

    if (existing.docs.length === 0) {
      console.warn('[SSO Callback] No CMS mapping for sub:', sub);
      redirect('/?error=no_cms_mapping');
    }

    const cmsUser = existing.docs[0];

    // 4. Sign Payload JWT pointing to the mapping record
    const jwtSecret = new TextEncoder().encode(PAYLOAD_SECRET);
    const payloadToken = await new SignJWT({
      id: cmsUser.id,
      email,
      collection: 'users',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(jwtSecret);

    // 5. Set cookie and redirect to admin
    const cookieStore = await cookies();
    cookieStore.set('payload-token', payloadToken, {
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
