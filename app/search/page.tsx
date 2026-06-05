'use client'

import { useState, useEffect, useMemo, Suspense, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { searchMovies, searchTV } from '@/lib/api'
import type { MovieSearchResult, TVSearchResult } from '@/lib/api'

const genreMap: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News',
  10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics',
}
const allGenres = Array.from(new Set(Object.values(genreMap))).sort()

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
  gap: '1rem',
}

function ResultCard({ href, posterUrl, posterAlt, title, subtitle }: {
  href: string
  posterUrl: string | null
  posterAlt: string
  title: string
  subtitle?: string
}) {
  return (
    <Link href={href} className="media-card">
      {posterUrl ? (
        <img src={posterUrl} alt={posterAlt}
          style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--placeholder-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-faint)' }}>
          No poster
        </div>
      )}
      <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
        <p style={{ fontWeight: 600, fontSize: '0.82rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
        {subtitle && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>{subtitle}</p>}
      </div>
    </Link>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '0.45rem 0.75rem',
  borderRadius: '6px',
  border: '1px solid var(--input-border)',
  background: 'var(--bg-subtle)',
  color: 'var(--text)',
  fontSize: '0.85rem',
  cursor: 'pointer',
}

function SearchContent() {
  const searchParams = useSearchParams()
  const q = searchParams?.get('q') ?? ''
  const type = searchParams?.get('type') ?? 'all'

  const [movies, setMovies] = useState<MovieSearchResult[]>([])
  const [tvShows, setTvShows] = useState<TVSearchResult[]>([])
  const [moviePage, setMoviePage] = useState(1)
  const [tvPage, setTvPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMoreMovies, setHasMoreMovies] = useState(true)
  const [hasMoreTv, setHasMoreTv] = useState(true)
  const [genreFilter, setGenreFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  const fetchInitialResults = useCallback(async () => {
    setLoading(true)
    try {
      const [moviesRes, tvRes] = await Promise.all([
        type === 'all' || type === 'movie' ? searchMovies(q, 1) : Promise.resolve(null),
        type === 'all' || type === 'tv' ? searchTV(q, 1) : Promise.resolve(null),
      ])
      if (moviesRes) { setMovies(moviesRes.results); setHasMoreMovies(moviesRes.page < moviesRes.totalPages) }
      if (tvRes) { setTvShows(tvRes.results); setHasMoreTv(tvRes.page < tvRes.totalPages) }
    } catch { /* silent */ } finally { setLoading(false) }
  }, [q, type])

  useEffect(() => {
    setMovies([]); setTvShows([]); setMoviePage(1); setTvPage(1)
    setHasMoreMovies(true); setHasMoreTv(true)
    if (q.trim()) void fetchInitialResults()
  }, [q, type, fetchInitialResults])

  const loadMore = useCallback(async () => {
    if (loading || (!hasMoreMovies && !hasMoreTv)) return
    setLoading(true)
    try {
      const [moviesRes, tvRes] = await Promise.all([
        (type === 'all' || type === 'movie') && hasMoreMovies ? searchMovies(q, moviePage + 1) : Promise.resolve(null),
        (type === 'all' || type === 'tv') && hasMoreTv ? searchTV(q, tvPage + 1) : Promise.resolve(null),
      ])
      if (moviesRes) { setMovies(prev => [...prev, ...moviesRes.results]); setMoviePage(moviesRes.page); setHasMoreMovies(moviesRes.page < moviesRes.totalPages) }
      if (tvRes) { setTvShows(prev => [...prev, ...tvRes.results]); setTvPage(tvRes.page); setHasMoreTv(tvRes.page < tvRes.totalPages) }
    } catch { /* silent */ } finally { setLoading(false) }
  }, [loading, hasMoreMovies, hasMoreTv, q, type, moviePage, tvPage])

  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 500) return
      if (hasMoreMovies || hasMoreTv) void loadMore()
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [loadMore, hasMoreMovies, hasMoreTv])

  const filteredMovies = useMemo(() => movies.filter(m => {
    const year = m.releaseDate?.slice(0, 4)
    const genres = (m.genreIds ?? []).map(id => genreMap[id]).filter(Boolean)
    return (!yearFilter || year === yearFilter) && (!genreFilter || genres.includes(genreFilter))
  }), [movies, yearFilter, genreFilter])

  const filteredTv = useMemo(() => tvShows.filter(s => {
    const year = s.firstAirDate?.slice(0, 4)
    const genres = (s.genreIds ?? []).map(id => genreMap[id]).filter(Boolean)
    return (!yearFilter || year === yearFilter) && (!genreFilter || genres.includes(genreFilter))
  }), [tvShows, yearFilter, genreFilter])

  if (!q.trim()) {
    return (
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Enter a search term in the bar above.</p>
      </main>
    )
  }

  const hasResults = filteredMovies.length > 0 || filteredTv.length > 0

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header row */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginTop: 0, fontSize: '1.35rem', marginBottom: '0.25rem', fontWeight: 800 }}>
          Results for{' '}
          <span style={{ color: 'var(--accent)' }}>&ldquo;{q}&rdquo;</span>
          {type !== 'all' && (
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '1rem', marginLeft: '0.5rem' }}>
              · {type === 'movie' ? 'Movies' : 'TV Shows'}
            </span>
          )}
        </h1>
        {loading && movies.length === 0 && tvShows.length === 0 && (
          <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem', margin: 0 }}>Searching…</p>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.75rem', padding: '0.875rem 1rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Genre</label>
          <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)} style={selectStyle}>
            <option value="">All Genres</option>
            {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Year</label>
          <input
            type="text" placeholder="e.g. 2023" value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            style={{ ...selectStyle, width: '110px' }}
          />
        </div>
        {(genreFilter || yearFilter) && (
          <button
            onClick={() => { setGenreFilter(''); setYearFilter('') }}
            style={{ alignSelf: 'flex-end', padding: '0.45rem 0.875rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Empty state */}
      {!loading && !hasResults && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No results for &ldquo;{q}&rdquo;</p>
          {(genreFilter || yearFilter) && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)' }}>Try removing filters.</p>
          )}
        </div>
      )}

      {filteredMovies.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            Movies ({filteredMovies.length}{hasMoreMovies ? '+' : ''})
          </h2>
          <div style={gridStyle}>
            {filteredMovies.map(m => (
              <ResultCard key={m.id} href={`/media/movie/${m.id}`} posterUrl={m.posterUrl} posterAlt={m.title}
                title={m.title} subtitle={m.releaseDate?.slice(0, 4)} />
            ))}
          </div>
        </section>
      )}

      {filteredTv.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--violet)' }}>
            TV Shows ({filteredTv.length}{hasMoreTv ? '+' : ''})
          </h2>
          <div style={gridStyle}>
            {filteredTv.map(s => (
              <ResultCard key={s.id} href={`/media/tv/${s.id}`} posterUrl={s.posterUrl} posterAlt={s.name}
                title={s.name} subtitle={s.firstAirDate?.slice(0, 4)} />
            ))}
          </div>
        </section>
      )}

      {loading && (hasResults || movies.length > 0 || tvShows.length > 0) && (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-faint)', fontSize: '0.875rem' }}>
          Loading more…
        </div>
      )}
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-faint)' }}>
        Loading search…
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
