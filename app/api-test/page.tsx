import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://tcss-460-group-7.onrender.com'
const SWAGGER_URL = `${API_BASE}/api-docs`

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  auth: boolean
  exampleBody?: string
  exampleResponse?: string
}

const endpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/v1/movies/popular?page=1',
    description: 'Get popular movies (page 1)',
    auth: false,
    exampleResponse: '{ "page": 1, "results": [...] }',
  },
  {
    method: 'GET',
    path: '/v1/tv/popular?page=1',
    description: 'Get popular TV shows (page 1)',
    auth: false,
    exampleResponse: '{ "page": 1, "results": [...] }',
  },
  {
    method: 'GET',
    path: '/v1/movie/search/title?q=inception&page=1',
    description: 'Search movies by title',
    auth: false,
    exampleResponse: '{ "results": [{ "id": 27205, "title": "Inception", ... }] }',
  },
  {
    method: 'GET',
    path: '/v1/tv/search/title?q=breaking+bad&page=1',
    description: 'Search TV shows by title',
    auth: false,
  },
  {
    method: 'GET',
    path: '/v1/media/movie/27205',
    description: 'Get enriched details for a movie (id 27205 = Inception)',
    auth: false,
    exampleResponse: '{ "metadata": {...}, "community": { "averageRating": 4.2, ... }, "recentReviews": [...] }',
  },
  {
    method: 'GET',
    path: '/v1/media/tv/1396',
    description: 'Get enriched details for a TV show (id 1396 = Breaking Bad)',
    auth: false,
  },
  {
    method: 'GET',
    path: '/v1/community/top-rated?page=1&limit=20',
    description: 'Community top-rated titles',
    auth: false,
  },
  {
    method: 'POST',
    path: '/v1/ratings/27205',
    description: 'Rate a title (requires sign-in)',
    auth: true,
    exampleBody: '{ "rating": 4, "media_type": "movie" }',
  },
  {
    method: 'POST',
    path: '/v1/reviews',
    description: 'Post a review (requires sign-in)',
    auth: true,
    exampleBody: '{ "title_id": 27205, "media_type": "movie", "content": "Great film!", "header": "Mind-bending" }',
  },
  {
    method: 'GET',
    path: '/v1/users/me/ratings?page=1',
    description: 'Your ratings (requires sign-in)',
    auth: true,
  },
  {
    method: 'GET',
    path: '/v1/users/me/reviews?page=1',
    description: 'Your reviews (requires sign-in)',
    auth: true,
  },
]

const METHOD_COLOR: Record<string, string> = {
  GET: '#00ffcc',
  POST: '#00aaff',
  PUT: '#ffaa00',
  DELETE: '#ff3355',
}

export const metadata = { title: 'API Test — Screen8' }

export default function ApiTestPage() {
  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>Test the API</h1>
      <p style={{ color: 'var(--text-muted)', margin: '0 0 2rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
        Screen8 talks to the{' '}
        <strong style={{ color: 'var(--text)' }}>Group 7 backend API</strong>.
        The easiest way to explore it is the interactive Swagger UI linked below.
        You can also try the common endpoints listed here using any HTTP tool (browser, curl, Postman).
      </p>

      {/* Swagger link card */}
      <div style={{
        border: '1px solid var(--accent)',
        borderRadius: '10px',
        padding: '1.25rem 1.5rem',
        background: 'var(--bg-subtle)',
        marginBottom: '2.5rem',
        boxShadow: '0 0 20px rgba(0,255,255,0.06)',
      }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700 }}>
          Interactive Swagger / OpenAPI Docs
        </h2>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 1rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Swagger lets you test every endpoint directly in the browser.
          Click <strong>Try it out</strong> on any endpoint, fill in the parameters, then hit <strong>Execute</strong>.
          Authenticated routes need a Bearer token — sign in to Screen8 first, open the browser
          DevTools → Application → Session Storage to copy your <code>accessToken</code>, then paste it
          in the <strong>Authorize</strong> button at the top of Swagger.
        </p>
        <a
          href={SWAGGER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ display: 'inline-flex', fontSize: '0.85rem', textDecoration: 'none' }}
        >
          Open Swagger UI ↗
        </a>
      </div>

      {/* Quick-reference endpoint table */}
      <h2 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>
        Common Endpoints
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        Base URL: <code style={{ color: 'var(--text)', background: 'var(--bg-muted)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.82rem' }}>{API_BASE}</code>
        &nbsp;&nbsp;Endpoints marked <span style={{ color: '#ffaa00', fontWeight: 700 }}>🔒</span> require an
        <code style={{ background: 'var(--bg-muted)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.82rem' }}>Authorization: Bearer &lt;token&gt;</code> header.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {endpoints.map((ep, i) => (
          <div key={i} style={{
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '0.875rem 1.125rem',
            background: 'var(--bg-subtle)',
          }}>
            <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
              <span style={{
                fontWeight: 800,
                fontSize: '0.75rem',
                letterSpacing: '0.06em',
                color: METHOD_COLOR[ep.method] ?? 'var(--text)',
                fontFamily: 'monospace',
                flexShrink: 0,
              }}>
                {ep.method}
              </span>
              <code style={{ fontSize: '0.82rem', color: 'var(--text)', wordBreak: 'break-all' }}>{ep.path}</code>
              {ep.auth && <span title="Requires authentication" style={{ fontSize: '0.75rem' }}>🔒</span>}
            </div>
            <p style={{ margin: '0 0 0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ep.description}</p>
            {ep.exampleBody && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <strong>Body:</strong>{' '}
                <code style={{ background: 'var(--bg-muted)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>{ep.exampleBody}</code>
              </p>
            )}
            {ep.exampleResponse && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <strong>Example response:</strong>{' '}
                <code style={{ background: 'var(--bg-muted)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>{ep.exampleResponse}</code>
              </p>
            )}
          </div>
        ))}
      </div>

      <p style={{ marginTop: '2rem', fontSize: '0.82rem', color: 'var(--text-faint)' }}>
        <Link href="/" style={{ color: 'var(--accent)' }}>← Back to Screen8</Link>
      </p>
    </main>
  )
}
