import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import type { MovieSearchResponse, TVSearchResponse } from '@/lib/api'

interface Props {
  searchParams: Promise<{ q?: string; type?: string }>
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
  gap: '1rem',
}

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '8px',
  overflow: 'hidden',
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
}

const posterPlaceholderStyle: React.CSSProperties = {
  width: '100%',
  aspectRatio: '2/3',
  background: 'var(--placeholder-bg)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  color: 'var(--text-faint)',
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = '', type = 'all' } = await searchParams

  let movieResults: MovieSearchResponse['results'] = []
  let tvResults: TVSearchResponse['results'] = []
  let movieError: string | null = null
  let tvError: string | null = null

  if (q.trim()) {
    const shouldSearchMovies = type === 'all' || type === 'movie'
    const shouldSearchTV = type === 'all' || type === 'tv'

    const [moviesResult, tvResult] = await Promise.allSettled([
      shouldSearchMovies
        ? apiFetch<MovieSearchResponse>(`/v1/movie/search/title?q=${encodeURIComponent(q)}`)
        : Promise.resolve(null),
      shouldSearchTV
        ? apiFetch<TVSearchResponse>(`/v1/tv/search/title?q=${encodeURIComponent(q)}`)
        : Promise.resolve(null),
    ])

    if (shouldSearchMovies) {
      if (moviesResult.status === 'fulfilled' && moviesResult.value) {
        movieResults = moviesResult.value.results
      } else if (moviesResult.status === 'rejected') {
        movieError = String(moviesResult.reason)
      }
    }
    if (shouldSearchTV) {
      if (tvResult.status === 'fulfilled' && tvResult.value) {
        tvResults = tvResult.value.results
      } else if (tvResult.status === 'rejected') {
        tvError = String(tvResult.reason)
      }
    }
  }

  const searched = q.trim().length > 0
  const hasResults = movieResults.length > 0 || tvResults.length > 0

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Search</h1>

      <form
        method="get"
        style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Search movies and TV shows…"
          autoFocus
          style={{
            flex: 1,
            minWidth: '220px',
            padding: '0.625rem 0.875rem',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '1rem',
            background: 'var(--card-bg)',
            color: 'var(--text)',
          }}
        />
        <select
          name="type"
          defaultValue={type}
          style={{
            padding: '0.625rem 0.875rem',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '1rem',
            background: 'var(--card-bg)',
            color: 'var(--text)',
          }}
        >
          <option value="all">All</option>
          <option value="movie">Movies</option>
          <option value="tv">TV Shows</option>
        </select>
        <button
          type="submit"
          style={{
            padding: '0.625rem 1.25rem',
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Search
        </button>
      </form>

      {searched && !hasResults && !movieError && !tvError && (
        <p style={{ color: 'var(--text-muted)' }}>No results found for &ldquo;{q}&rdquo;.</p>
      )}

      {movieError && (
        <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>Movies error: {movieError}</p>
      )}
      {tvError && (
        <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>TV error: {tvError}</p>
      )}

      {movieResults.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Movies ({movieResults.length})</h2>
          <div style={gridStyle}>
            {movieResults.map((m) => (
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
                <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
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
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                    {m.releaseDate?.slice(0, 4)} &nbsp;★ {m.voteAverage.toFixed(1)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {tvResults.length > 0 && (
        <section>
          <h2 style={{ marginBottom: '1rem' }}>TV Shows ({tvResults.length})</h2>
          <div style={gridStyle}>
            {tvResults.map((s) => (
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
                <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
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
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                    {s.firstAirDate?.slice(0, 4)} &nbsp;★ {s.voteAverage.toFixed(1)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
