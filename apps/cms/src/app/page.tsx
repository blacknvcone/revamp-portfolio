import Link from 'next/link';

const BIFROST_URL = process.env.BIFROST_URL || 'https://bifrost.danipras.dev';
const MONETALIS_URL = 'https://monetalis.danipras.dev';

export default async function HomePage() {
  let healthStatus = 'unknown';
  try {
    const baseUrl =
      process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3001';
    const res = await fetch(`${baseUrl}/api/health`, { cache: 'no-store' });
    healthStatus = res.ok ? 'healthy' : 'degraded';
  } catch {
    healthStatus = 'unreachable';
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#fafafa',
        color: '#1a1a1a',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 560, padding: '2rem' }}>
        <h1
          style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}
        >
          Payload CMS
        </h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Shared backend for Portfolio Web &amp; Monetalis
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.8rem',
            borderRadius: 8,
            backgroundColor:
              healthStatus === 'healthy' ? '#e6f9ed' : '#fef3cd',
            fontSize: '0.85rem',
            marginBottom: '2rem',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor:
                healthStatus === 'healthy' ? '#22c55e' : '#eab308',
            }}
          />
          {healthStatus === 'healthy'
            ? 'All systems operational'
            : `Status: ${healthStatus}`}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <Link href="/admin" style={linkStyle}>
            Admin Panel →
          </Link>
          <a
            href={MONETALIS_URL}
            style={linkStyle}
            target="_blank"
            rel="noopener noreferrer"
          >
            Monetalis Dashboard →
          </a>
          <a
            href={`${BIFROST_URL}/auth/login?redirect_to=${encodeURIComponent('https://cms.danipras.dev/admin/sso')}`}
            style={linkStyle}
            target="_blank"
            rel="noopener noreferrer"
          >
            Login via SSO →
          </a>
        </div>
      </div>
    </main>
  );
}

const linkStyle: React.CSSProperties = {
  display: 'block',
  padding: '0.75rem 1.25rem',
  border: '1px solid #e5e5e5',
  borderRadius: 8,
  textDecoration: 'none',
  color: '#1a1a1a',
  fontSize: '0.95rem',
  transition: 'border-color 0.15s',
};
