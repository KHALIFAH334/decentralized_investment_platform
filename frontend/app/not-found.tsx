'use client';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '10vh' }}>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: 'var(--space-2xl)' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: 'var(--space-sm)', color: 'var(--text-muted)' }}>404</h1>
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>Page Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <button className="btn-primary">Return Home</button>
        </Link>
      </div>
    </div>
  );
}
