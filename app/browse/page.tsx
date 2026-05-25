import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import type { PopularMoviesResponse, PopularTVResponse } from '@/lib/api'

const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  overflow: 'hidden',
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
}

const posterPlaceholderStyle: React.CSSProperties = {
  width: '100%',
  aspectRatio: '2/3',
  background: '#e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  color: '#9ca3af',
}

const cardBodyStyle: React.CSSProperties = {
  padding: '0.5rem 0.6rem 0.6rem',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
  gap: '1rem',
}

export default async function BrowsePage() {
  const [moviesResult, tvResult] = await Promise.allSettled([
    apiFetch<PopularMoviesResponse>('/v1/movies/popular'),
    apiFetch<PopularTVResponse>('/v1/tv/popular'),
  ])

  const movies = moviesResult.status === 'fulfilled' ? moviesResult.value.results : []
  const shows = tvResult.status === 'fulfilled' ? tvResult.value.results : []
  const moviesError = moviesResult.status === 'rejected' ? String(moviesResult.reason) : null
  const tvError = tvResult.status === 'rejected' ? String(tvResult.reason) : null

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ marginTop: 0, marginBottom: '2rem' }}>Browse</h1>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Popular Movies</h2>
        {moviesError ? (
          <p style={{ color: '#dc2626' }}>Could not load movies: {moviesError}</p>
        ) : movies.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No movies returned.</p>
        ) : (
          <div style={gridStyle}>
            {movies.map((m) => (
              <Link key={m.id} href={`/media/movie/${m.id}`} style={cardStyle}>
                {m.posterUrl ? (
                  <img
                    src={m.posterUrl}
                    alt={m.title}
                    style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={posterPlaceholderStyle}>No poster</div>
                )}
                <div style={cardBodyStyle}>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.title}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.2rem 0 0' }}>
                    {m.releaseDate?.slice(0, 4)} &nbsp;★ {m.voteAverage.toFixed(1)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ marginBottom: '1rem' }}>Popular TV Shows</h2>
        {tvError ? (
          <p style={{ color: '#dc2626' }}>Could not load TV shows: {tvError}</p>
        ) : shows.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No TV shows returned.</p>
        ) : (
          <div style={gridStyle}>
            {shows.map((s) => (
              <Link key={s.id} href={`/media/tv/${s.id}`} style={cardStyle}>
                {s.posterUrl ? (
                  <img
                    src={s.posterUrl}
                    alt={s.name}
                    style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={posterPlaceholderStyle}>No poster</div>
                )}
                <div style={cardBodyStyle}>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.2rem 0 0' }}>
                    {s.firstAirDate?.slice(0, 4)} &nbsp;★ {s.voteAverage.toFixed(1)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
