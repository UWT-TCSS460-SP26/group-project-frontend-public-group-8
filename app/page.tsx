import Link from 'next/link'

export default function Home() {
  return (
    <main
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '5rem 1.5rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 }}>
        Discover Movies &amp; Shows
      </h1>
      <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', marginBottom: '3rem', lineHeight: 1.6 }}>
        Search, browse, and learn about the films and shows other people are watching. Find your new favorites and rate what you&apos;ve watched.
      </p>

      <Link
        href="/browse"
        style={{
          display: 'inline-block',
          padding: '0.75rem 2rem',
          background: 'var(--bg-muted)',
          color: 'var(--text-secondary)',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
        }}
      >
        Browse Popular →
      </Link>
    </main>
  )
}
