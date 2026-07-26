// Force dynamic rendering so LOGTO_CLIENT_ID is read at runtime, not build time
export const dynamic = 'force-dynamic';

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'https://auth.danipras.dev';
const LOGTO_CLIENT_ID = process.env.LOGTO_CLIENT_ID || '';
const CMS_URL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'https://cms.danipras.dev';

export default function HomePage() {
  // Build Logto OIDC authorize URL
  const logtoAuthUrl = `${LOGTO_ENDPOINT}/oidc/auth?` + new URLSearchParams({
    client_id: LOGTO_CLIENT_ID,
    redirect_uri: `${CMS_URL}/sso`,
    response_type: 'code',
    scope: 'openid profile email',
    state: 'cms-sso',
  }).toString();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
        padding: '2rem',
        margin: 0,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          textAlign: 'center',
        }}
      >
        {/* Payload Logo */}
        <div
          style={{
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 25 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12.5 0L25 25H0L12.5 0Z" fill="white" />
            <path
              d="M12.5 5L20 25H5L12.5 5Z"
              fill="#1a1a1a"
            />
            <path d="M12.5 0L25 25H0L12.5 0Z" fill="white" fillOpacity="0.5" />
          </svg>
          <span
            style={{
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            Payload CMS
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            color: '#999',
            fontSize: '0.875rem',
            marginBottom: '2rem',
            lineHeight: 1.5,
          }}
        >
          Shared backend for Portfolio Web &amp; Monetalis
        </p>

        {/* SSO Login Button — redirects directly to Logto */}
        <a
          href={logtoAuthUrl}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            width: '100%',
            padding: '0.875rem 1.5rem',
            marginBottom: '0.75rem',
            backgroundColor: '#ffffff',
            color: '#1a1a1a',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.9375rem',
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'background-color 0.15s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          Login with SSO
        </a>
      </div>
    </div>
  );
}
