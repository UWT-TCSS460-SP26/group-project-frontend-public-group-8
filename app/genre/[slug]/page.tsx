'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { searchTVByGenre, searchMovieByGenre } from '@/lib/api'
import type { TVSearchResult, MovieSearchResult } from '@/lib/api'

const GENRE_TITLES: Record<string, string> = {
  animation:       'Animation',
  drama:           'Drama',
  crime:           'Crime',
  action_adventure:'Action & Adventure',
  comedy:          'Comedy',
  documentary:     'Documentary',
  reality:         'Reality TV',
  sci_fi_fantasy:  'Sci-Fi & Fantasy',
  kids:            'Kids & Family',
  family:          'Kids & Family',
  'kids,family':   'Kids & Family',
}

function formatSlug(slug: string): string {
  if (GENRE_TITLES[slug]) return GENRE_TITLES[slug]
  return slug.split(/[_,]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' & ')
}

const CARD_WIDTH = 150

function CardSkeleton() {
  return (
    <div style={{ minWidth: CARD_WIDTH, maxWidth: CARD_WIDTH }}>
      <div className="skeleton" style={{ width: '100%', aspectRatio: '2/3', borderRadius: '8px 8px 0 0' }} />
      <div style={{ padding: '0.5rem 0.6rem 0.6rem', background: 'var(--card-bg)', borderRadius: '0 0 8px 8px', border: '1px solid var(--border)', borderTop: 'none' }}>
        <div className="skeleton" style={{ height: '12px', width: '80%', marginBottom: '6px' }} />
        <div className="skeleton" style={{ height: '10px', width: '40%' }} />
      </div>
    </div>
  )
}

export default function GenrePage() {
  const params = useParams() ?? {}
  const rawSlug = params.slug
  const slug = typeof rawSlug === 'string' ? rawSlug : Array.isArray(rawSlug) ? rawSlug[0] : ''
  const genres = slug.split(',').filter(Boolean)
  const pageTitle = formatSlug(slug)

  const [tab, setTab] = useState<'tv' | 'movies'>('tv')

  // TV state
  const [tvItems, setTvItems] = useState<TVSearchResult[]>([])
  const [tvPage, setTvPage] = useState(1)
  const [tvHasMore, setTvHasMore] = useState(true)
  const [tvLoading, setTvLoading] = useState(true)
  const tvMounted = useRef(false)

  // Movie state
  const [movieItems, setMovieItems] = useState<MovieSearchResult[]>([])
  const [moviePage, setMoviePage] = useState(1)
  const [movieHasMore, setMovieHasMore] = useState(true)
  const [movieLoading, setMovieLoading] = useState(true)
  const movieMounted = useRef(false)

  // Initial load: TV
  useEffect(() => {
    if (tvMounted.current) return
    tvMounted.current = true
    setTvLoading(true)
    Promise.all(genres.map(g => searchTVByGenre(g, 1)))
      .then(responses => {
        const combined = responses.flatMap(r => r.results)
        setTvItems(Array.from(new Map(combined.map(s => [s.id, s])).values()))
        setTvHasMore(responses.some(r => r.page < r.totalPages))
      })
      .catch(() => {})
      .finally(() => setTvLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  // Initial load: Movies
  useEffect(() => {
    if (movieMounted.current) return
    movieMounted.current = true
    setMovieLoading(true)
    Promise.all(genres.map(g => searchMovieByGenre(g, 1)))
      .then(responses => {
        const combined = responses.flatMap(r => r.results)
        setMovieItems(Array.from(new Map(combined.map(m => [m.id, m])).values()))
        setMovieHasMore(responses.some(r => r.page < r.totalPages))
      })
      .catch(() => {})
      .finally(() => setMovieLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const loadMoreTV = useCallback(async () => {
    if (!tvHasMore || tvLoading) return
    setTvLoading(true)
    try {
      const next = tvPage + 1
      const responses = await Promise.all(genres.map(g => searchTVByGenre(g, next)))
      setTvItems(prev => {
        const existing = new Set(prev.map(s => s.id))
        return [...prev, ...responses.flatMap(r => r.results).filter(s => !existing.has(s.id))]
      })
      setTvPage(next)
      setTvHasMore(responses.some(r => r.page < r.totalPages))
    } catch {} finally { setTvLoading(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tvPage, tvHasMore, tvLoading, slug])

  const loadMoreMovies = useCallback(async () => {
    if (!movieHasMore || movieLoading) return
    setMovieLoading(true)
    try {
      const next = moviePage + 1
      const responses = await Promise.all(genres.map(g => searchMovieByGenre(g, next)))
      setMovieItems(prev => {
        const existing = new Set(prev.map(m => m.id))
        return [...prev, ...responses.flatMap(r => r.results).filter(m => !existing.has(m.id))]
      })
      setMoviePage(next)
      setMovieHasMore(responses.some(r => r.page < r.totalPages))
    } catch {} finally { setMovieLoading(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moviePage, movieHasMore, movieLoading, slug])

  // Infinite scroll
  useEffect(() => {
    const handler = () => {
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 300) {
        if (tab === 'tv') loadMoreTV()
        else loadMoreMovies()
      }
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [tab, loadMoreTV, loadMoreMovies])

  const tabBase: React.CSSProperties = {
    padding: '0.35rem 1rem',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
  }
  const tabActiveStyle: React.CSSProperties = {
    ...tabBase,
    background: 'var(--accent)',
    color: '#000',
    borderColor: 'var(--accent)',
  }

  const isLoading = tab === 'tv' ? tvLoading : movieLoading
  const tvCount = tvItems.length
  const movieCount = movieItems.length

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Back link */}
      <Link
        href="/"
        style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.5rem' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        Home
      </Link>

      {/* Page heading */}
      <h1 style={{
        fontFamily: 'var(--font-orbitron, Orbitron, monospace)',
        fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
        fontWeight: 900,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--accent)',
        textShadow: '0 0 14px rgba(0,212,255,0.85), 0 0 36px rgba(0,212,255,0.4)',
        margin: '0 0 1.5rem',
      }}>
        {pageTitle}
      </h1>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button onClick={() => setTab('tv')} style={tab === 'tv' ? tabActiveStyle : tabBase} aria-pressed={tab === 'tv'}>
          TV Shows{tvCount > 0 ? ` (${tvCount})` : ''}
        </button>
        <button onClick={() => setTab('movies')} style={tab === 'movies' ? tabActiveStyle : tabBase} aria-pressed={tab === 'movies'}>
          Movies{movieCount > 0 ? ` (${movieCount})` : ''}
        </button>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_WIDTH}px, 1fr))`,
        gap: '1rem',
      }}>
        {tab === 'tv' && (
          tvLoading && tvItems.length === 0
            ? Array.from({ length: 20 }).map((_, i) => <CardSkeleton key={i} />)
            : tvItems.map(s => (
              <Link key={s.id} href={`/media/tv/${s.id}`} className="media-card" style={{ display: 'block' }}>
                {s.posterUrl ? (
                  <img src={s.posterUrl} alt={s.name} loading="lazy"
                    style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--placeholder-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-faint)', padding: '0.5rem', textAlign: 'center' }}>
                    {s.name}
                  </div>
                )}
                <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>{s.firstAirDate?.slice(0, 4)}</p>
                </div>
              </Link>
            ))
        )}

        {tab === 'movies' && (
          movieLoading && movieItems.length === 0
            ? Array.from({ length: 20 }).map((_, i) => <CardSkeleton key={i} />)
            : movieItems.map(m => (
              <Link key={m.id} href={`/media/movie/${m.id}`} className="media-card" style={{ display: 'block' }}>
                {m.posterUrl ? (
                  <img src={m.posterUrl} alt={m.title} loading="lazy"
                    style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--placeholder-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-faint)', padding: '0.5rem', textAlign: 'center' }}>
                    {m.title}
                  </div>
                )}
                <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>{m.releaseDate?.slice(0, 4)}</p>
                </div>
              </Link>
            ))
        )}
      </div>

      {/* Bottom loading indicator */}
      {isLoading && (tab === 'tv' ? tvItems.length > 0 : movieItems.length > 0) && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-faint)', fontSize: '0.875rem' }}>
          Loading more…
        </div>
      )}

      {/* No results */}
      {!isLoading && (tab === 'tv' ? tvItems.length === 0 : movieItems.length === 0) && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-faint)', fontSize: '0.9rem', border: '1px dashed var(--border)', borderRadius: '8px' }}>
          No {tab === 'tv' ? 'TV shows' : 'movies'} found for this genre.
        </div>
      )}
    </main>
  )
}
