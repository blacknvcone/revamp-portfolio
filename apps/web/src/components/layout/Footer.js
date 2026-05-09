import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-subtle bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-text-muted">
          &copy; {year} Dani Prasetya. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            Home
          </Link>
          <Link
            href="/projects"
            className="text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            Projects
          </Link>
        </div>
      </div>
    </footer>
  );
}
