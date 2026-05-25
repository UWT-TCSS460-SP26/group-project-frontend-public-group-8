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
        Discover Movies &amp; TV
      </h1>
      <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '3rem', lineHeight: 1.6 }}>
        Search, browse, and read about your favourite films and TV shows — powered by the Group 7
        API.
      </p>

      <form
        method="get"
        action="/search"
        style={{
          display: 'flex',
          gap: '0.5rem',
          maxWidth: '500px',
          margin: '0 auto 2.5rem',
        }}
      >
        <input
          name="q"
          placeholder="Search movies or shows…"
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '1rem',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '0.75rem 1.5rem',
            background: '#1a73e8',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Search
        </button>
      </form>

      <Link
        href="/browse"
        style={{
          display: 'inline-block',
          padding: '0.75rem 2rem',
          background: '#f3f4f6',
          color: '#374151',
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
