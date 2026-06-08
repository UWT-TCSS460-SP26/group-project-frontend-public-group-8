'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { searchTVByGenre, searchMovieByGenre } from '@/lib/api'
import type { TVSearchResult, MovieSearchResult } from '@/lib/api'

const GENRE_TITLES: Record<string, string> = {
  animation:        'Animation',
  drama:            'Drama',
  crime:            'Crime',
  action_adventure: 'Action & Adventure',
  comedy:           'Comedy',
  documentary:      'Documentary',
  reality:          'Reality TV',
  sci_fi_fantasy:   'Sci-Fi & Fantasy',
  kids:             'Kids & Family',
  family:           'Kids & Family',
  'kids,family':    'Kids & Family',
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

// Returns page numbers and ellipsis markers for a compact pagination bar.
// Always includes first, last, and a window of ±1 around the current page.
function getPaginationPages(current: number, total: number): (number | '...')[] {
  if (total <= 1) return []
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end   = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')
  pages.push(total)

  return pages
}

function GenrePageInner() {
  const params  = useParams() ?? {}
  const rawSlug = params.slug
  const slug    = typeof rawSlug === 'string' ? rawSlug : Array.isArray(rawSlug) ? rawSlug[0] : ''
  const pageTitle = formatSlug(slug)

  const router       = useRouter()
  const searchParams = useSearchParams()

  const typeParam = searchParams?.get('type') ?? 'tv'
  const pageParam = parseInt(searchParams?.get('page') ?? '1', 10)
  const tab: 'tv' | 'movie' = typeParam === 'movie' ? 'movie' : 'tv'
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam

  // Separate state per tab so switching tabs doesn't wipe already-loaded data
  const [tvItems, setTvItems]               = useState<TVSearchResult[]>([])
  const [tvTotalPages, setTvTotalPages]     = useState(1)
  const [tvTotalResults, setTvTotalResults] = useState<number | null>(null)

  const [movieItems, setMovieItems]               = useState<MovieSearchResult[]>([])
  const [movieTotalPages, setMovieTotalPages]     = useState(1)
  const [movieTotalResults, setMovieTotalResults] = useState<number | null>(null)

  // Shared loading / error for whichever tab is active
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Incremented on every new fetch to discard stale responses
  const fetchIdRef = useRef(0)

  // TV fetch — fires when slug, page, or tab changes and tab === 'tv'
  useEffect(() => {
    if (tab !== 'tv') return
    const genres  = slug.split(',').filter(Boolean)
    const fetchId = ++fetchIdRef.current

    setLoading(true)
    setError(null)
    setTvItems([])

    Promise.all(genres.map(g => searchTVByGenre(g, currentPage)))
      .then(responses => {
        if (fetchId !== fetchIdRef.current) return
        const combined = responses.flatMap(r => r.results)
        const unique   = Array.from(new Map(combined.map(s => [s.id, s])).values())
        setTvItems(unique)
        setTvTotalPages(Math.max(1, ...responses.map(r => r.totalPages)))
        setTvTotalResults(responses.reduce((sum, r) => sum + r.totalResults, 0))
      })
      .catch(() => {
        if (fetchId !== fetchIdRef.current) return
        setError('Failed to load TV shows. Please try again.')
      })
      .finally(() => {
        if (fetchId !== fetchIdRef.current) return
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, currentPage, tab])

  // Movie fetch — fires when slug, page, or tab changes and tab === 'movie'
  useEffect(() => {
    if (tab !== 'movie') return
    const genres  = slug.split(',').filter(Boolean)
    const fetchId = ++fetchIdRef.current

    setLoading(true)
    setError(null)
    setMovieItems([])

    Promise.all(genres.map(g => searchMovieByGenre(g, currentPage)))
      .then(responses => {
        if (fetchId !== fetchIdRef.current) return
        const combined = responses.flatMap(r => r.results)
        const unique   = Array.from(new Map(combined.map(m => [m.id, m])).values())
        setMovieItems(unique)
        setMovieTotalPages(Math.max(1, ...responses.map(r => r.totalPages)))
        setMovieTotalResults(responses.reduce((sum, r) => sum + r.totalResults, 0))
      })
      .catch(() => {
        if (fetchId !== fetchIdRef.current) return
        setError('Failed to load movies. Please try again.')
      })
      .finally(() => {
        if (fetchId !== fetchIdRef.current) return
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, currentPage, tab])

  // Push URL change and scroll to the top of the page.
  // Omits params that match the defaults (tv, page 1) to keep URLs clean.
  const navigateTo = useCallback((newTab: 'tv' | 'movie', newPage: number) => {
    const p = new URLSearchParams()
    if (newTab !== 'tv') p.set('type', newTab)
    if (newPage !== 1)   p.set('page', String(newPage))
    const qs = p.toString()
    router.push(`/genre/${slug}${qs ? `?${qs}` : ''}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [slug, router])

  const items      = tab === 'tv' ? tvItems      : movieItems
  const totalPages = tab === 'tv' ? tvTotalPages : movieTotalPages
  const paginationPages = getPaginationPages(currentPage, totalPages)

  // ── Shared inline style objects ────────────────────────────────────────────
  const tabBase: React.CSSProperties = {
    padding:      '0.35rem 1rem',
    borderRadius: '6px',
    borderWidth:  '1px',
    borderStyle:  'solid',
    borderColor:  'var(--border)',
    background:   'transparent',
    color:        'var(--text-muted)',
    fontSize:     '0.85rem',
    fontWeight:   600,
    cursor:       'pointer',
    transition:   'background 0.15s, color 0.15s, border-color 0.15s',
  }
  const tabActive: React.CSSProperties = {
    ...tabBase,
    background:  'var(--accent)',
    color:       '#000',
    borderColor: 'var(--accent)',
  }
  const pgBase: React.CSSProperties = {
    padding:      '0.3rem 0.65rem',
    minWidth:     '2.2rem',
    borderRadius: '5px',
    borderWidth:  '1px',
    borderStyle:  'solid',
    borderColor:  'var(--border)',
    background:   'transparent',
    color:        'var(--text-muted)',
    fontSize:     '0.85rem',
    fontWeight:   600,
    cursor:       'pointer',
    lineHeight:   1.5,
    transition:   'background 0.12s, color 0.12s, border-color 0.12s',
  }
  const pgActive: React.CSSProperties = {
    ...pgBase,
    background:  'var(--accent)',
    color:       '#000',
    borderColor: 'var(--accent)',
  }
  const pgDisabled: React.CSSProperties = {
    ...pgBase,
    opacity: 0.35,
    cursor:  'not-allowed',
  }

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Back link */}
      <Link
        href="/"
        style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.5rem' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
        Home
      </Link>

      {/* Cyberpunk genre heading */}
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

      {/* Tab bar — counts show totals from the API, not current page size */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigateTo('tv', 1)} style={tab === 'tv' ? tabActive : tabBase} aria-pressed={tab === 'tv'}>
          TV Shows{tvTotalResults !== null ? ` (${tvTotalResults.toLocaleString()})` : ''}
        </button>
        <button onClick={() => navigateTo('movie', 1)} style={tab === 'movie' ? tabActive : tabBase} aria-pressed={tab === 'movie'}>
          Movies{movieTotalResults !== null ? ` (${movieTotalResults.toLocaleString()})` : ''}
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_WIDTH}px, 1fr))`, gap: '1rem' }}>
          {Array.from({ length: 20 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--danger, #ff4d4d)', fontSize: '0.9rem', border: '1px dashed var(--border)', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Results grid */}
      {!loading && !error && items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_WIDTH}px, 1fr))`, gap: '1rem' }}>
          {tab === 'tv'
            ? tvItems.map(s => (
              <Link key={s.id} href={`/media/tv/${s.id}`} className="media-card" style={{ display: 'block' }}>
                {s.posterUrl
                  ? <img src={s.posterUrl} alt={s.name} loading="lazy" style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--placeholder-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-faint)', padding: '0.5rem', textAlign: 'center' }}>{s.name}</div>
                }
                <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>{s.firstAirDate?.slice(0, 4)}</p>
                </div>
              </Link>
            ))
            : movieItems.map(m => (
              <Link key={m.id} href={`/media/movie/${m.id}`} className="media-card" style={{ display: 'block' }}>
                {m.posterUrl
                  ? <img src={m.posterUrl} alt={m.title} loading="lazy" style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--placeholder-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-faint)', padding: '0.5rem', textAlign: 'center' }}>{m.title}</div>
                }
                <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>{m.releaseDate?.slice(0, 4)}</p>
                </div>
              </Link>
            ))
          }
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-faint)', fontSize: '0.9rem', border: '1px dashed var(--border)', borderRadius: '8px' }}>
          No {tab === 'tv' ? 'TV shows' : 'movies'} found{currentPage > 1 ? ` on page ${currentPage}` : ' for this genre'}.
        </div>
      )}

      {/* Pagination controls — hidden during loading to avoid stale page numbers */}
      {!loading && !error && totalPages > 1 && (
        <nav
          aria-label="Pagination"
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem', marginTop: '2rem', flexWrap: 'wrap' }}
        >
          <button
            onClick={() => navigateTo(tab, currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            style={currentPage <= 1 ? pgDisabled : pgBase}
          >
            ← Prev
          </button>

          {paginationPages.map((p, idx) =>
            p === '...'
              ? <span key={`dot-${idx}`} style={{ padding: '0 0.1rem', color: 'var(--text-faint)', fontSize: '0.85rem', userSelect: 'none' }}>…</span>
              : (
                <button
                  key={p}
                  onClick={() => navigateTo(tab, p as number)}
                  aria-label={`Page ${p}`}
                  aria-current={p === currentPage ? 'page' : undefined}
                  style={p === currentPage ? pgActive : pgBase}
                >
                  {p}
                </button>
              )
          )}

          <button
            onClick={() => navigateTo(tab, currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
            style={currentPage >= totalPages ? pgDisabled : pgBase}
          >
            Next →
          </button>
        </nav>
      )}
    </main>
  )
}

export default function GenrePage() {
  return (
    <Suspense fallback={
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_WIDTH}px, 1fr))`, gap: '1rem' }}>
          {Array.from({ length: 20 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </main>
    }>
      <GenrePageInner />
    </Suspense>
  )
}
