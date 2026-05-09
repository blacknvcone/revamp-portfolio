import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Portfolio CMS</h1>
      <p>
        <Link href="/admin">Go to Admin Panel</Link>
      </p>
    </main>
  );
}
