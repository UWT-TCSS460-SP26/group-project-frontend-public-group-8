'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { searchMovies, searchTV } from '@/lib/api'
import type { MovieSearchResult, TVSearchResult } from '@/lib/api'

type Filter = 'all' | 'movie' | 'tv'

const POSTER_W = 92
const POSTER_H = 138

function ResultRow({
  href,
  posterUrl,
  title,
  year,
  typeLabel,
  overview,
}: {
  href: string
  posterUrl: string | null
  title: string
  year?: string
  typeLabel: 'Movie' | 'TV Show'
  overview?: string
}) {
  const isMovie = typeLabel === 'Movie'
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '0.75rem',
        borderRadius: '8px',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--border)',
        background: 'var(--card-bg)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
        marginBottom: '0.625rem',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.borderColor = isMovie ? 'var(--accent)' : 'var(--violet)'
        el.style.background = 'var(--bg-subtle)'
        el.style.boxShadow = isMovie
          ? '0 0 0 1px var(--accent), 0 4px 12px rgba(0,212,255,0.08)'
          : '0 0 0 1px var(--violet), 0 4px 12px rgba(255,42,173,0.08)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.borderColor = 'var(--border)'
        el.style.background = 'var(--card-bg)'
        el.style.boxShadow = 'none'
      }}
    >
      {/* Poster */}
      <div style={{
        flexShrink: 0,
        width: POSTER_W,
        height: POSTER_H,
        borderRadius: '6px',
        overflow: 'hidden',
        background: 'var(--placeholder-bg)',
      }}>
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', color: 'var(--text-faint)', textAlign: 'center', padding: '0.5rem',
          }}>
            No poster
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: '0.1rem' }}>
        <p style={{
          fontWeight: 700, fontSize: '1rem', margin: '0 0 0.25rem',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: 'var(--text)',
        }}>
          {title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
          {year && (
            <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{year}</span>
          )}
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '0.15rem 0.45rem',
            borderRadius: '3px',
            background: isMovie ? 'rgba(0,212,255,0.12)' : 'rgba(255,42,173,0.12)',
            color: isMovie ? 'var(--accent)' : 'var(--violet)',
          }}>
            {typeLabel}
          </span>
        </div>
        {overview && (
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            margin: 0,
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {overview}
          </p>
        )}
      </div>
    </Link>
  )
}

function RowSkeleton() {
  return (
    <div style={{
      display: 'flex', gap: '1rem', padding: '0.75rem',
      borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)',
      background: 'var(--card-bg)', marginBottom: '0.625rem',
    }}>
      <div className="skeleton" style={{ flexShrink: 0, width: POSTER_W, height: POSTER_H, borderRadius: '6px' }} />
      <div style={{ flex: 1, paddingTop: '0.1rem' }}>
        <div className="skeleton" style={{ height: '18px', width: '55%', marginBottom: '0.5rem', borderRadius: '4px' }} />
        <div className="skeleton" style={{ height: '13px', width: '25%', marginBottom: '0.75rem', borderRadius: '4px' }} />
        <div className="skeleton" style={{ height: '12px', width: '98%', marginBottom: '0.3rem', borderRadius: '3px' }} />
        <div className="skeleton" style={{ height: '12px', width: '88%', marginBottom: '0.3rem', borderRadius: '3px' }} />
        <div className="skeleton" style={{ height: '12px', width: '72%', borderRadius: '3px' }} />
      </div>
    </div>
  )
}

function SearchPageInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const urlQ    = searchParams?.get('q') ?? ''
  const urlType = (searchParams?.get('type') ?? 'all') as Filter

  // Local input state for instant typing feedback (not derived from URL on every render)
  const [inputValue, setInputValue] = useState(urlQ)

  // API result state
  const [movies,     setMovies]     = useState<MovieSearchResult[]>([])
  const [tvShows,    setTvShows]    = useState<TVSearchResult[]>([])
  const [movieTotal, setMovieTotal] = useState(0)
  const [tvTotal,    setTvTotal]    = useState(0)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const fetchIdRef  = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Sync input ← URL when user navigates back/forward.
  // Cancel any pending debounce so a stale timeout does not overwrite the restored URL.
  useEffect(() => {
    clearTimeout(debounceRef.current)
    setInputValue(urlQ)
  }, [urlQ])

  // Fetch results whenever the committed URL query changes.
  // Always fetch both types so filter counts are always accurate.
  useEffect(() => {
    if (!urlQ.trim()) {
      setMovies([]); setTvShows([])
      setMovieTotal(0); setTvTotal(0)
      setLoading(false); setError(null)
      return
    }

    const fetchId = ++fetchIdRef.current
    setLoading(true)
    setError(null)
    setMovies([]); setTvShows([])

    Promise.all([searchMovies(urlQ), searchTV(urlQ)])
      .then(([moviesRes, tvRes]) => {
        if (fetchId !== fetchIdRef.current) return
        setMovies(moviesRes.results)
        setMovieTotal(moviesRes.totalResults)
        setTvShows(tvRes.results)
        setTvTotal(tvRes.totalResults)
      })
      .catch(() => {
        if (fetchId !== fetchIdRef.current) return
        setError('Search failed. Please try again.')
      })
      .finally(() => {
        if (fetchId !== fetchIdRef.current) return
        setLoading(false)
      })
  }, [urlQ])

  // Build a clean URL for a given query + type
  const buildURL = useCallback((q: string, type: Filter) => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (type !== 'all') p.set('type', type)
    return `/search${p.toString() ? `?${p.toString()}` : ''}`
  }, [])

  // Typing: debounce the URL update so we don't pollute history
  const handleInputChange = (val: string) => {
    setInputValue(val)
    clearTimeout(debounceRef.current)
    if (!val.trim()) {
      router.replace(buildURL('', urlType))
      return
    }
    debounceRef.current = setTimeout(() => {
      router.replace(buildURL(val.trim(), urlType))
    }, 350)
  }

  // Submit (Enter or button): immediate URL push (creates a history entry)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    clearTimeout(debounceRef.current)
    router.push(buildURL(inputValue.trim(), urlType))
  }

  // Filter button: update URL immediately, keep current query
  const handleFilterChange = (newType: Filter) => {
    clearTimeout(debounceRef.current)
    router.replace(buildURL(inputValue.trim() || urlQ, newType))
  }

  const hasResults    = movies.length > 0 || tvShows.length > 0
  const showMovieRows = urlType === 'all' || urlType === 'movie'
  const showTVRows    = urlType === 'all' || urlType === 'tv'

  const filterBtnBase: React.CSSProperties = {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    width:          '100%',
    padding:        '0.6rem 0.875rem',
    borderRadius:   '6px',
    borderWidth:    '1px',
    borderStyle:    'solid',
    borderColor:    'var(--border)',
    background:     'transparent',
    color:          'var(--text-muted)',
    fontSize:       '0.875rem',
    fontWeight:     600,
    cursor:         'pointer',
    textAlign:      'left' as const,
    transition:     'background 0.12s, color 0.12s, border-color 0.12s',
    gap:            '0.5rem',
    whiteSpace:     'nowrap' as const,
  }

  const filterBtnActive: React.CSSProperties = {
    ...filterBtnBase,
    background:  'var(--accent-dim)',
    color:       '#fff',
    borderColor: 'var(--accent-dim)',
  }

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* ── Prominent search input ───────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '1.75rem' }}>
        <div style={{ position: 'relative', maxWidth: '640px' }}>
          <div style={{
            position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none', color: 'var(--text-faint)', display: 'flex',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <input
            type="search"
            value={inputValue}
            onChange={e => handleInputChange(e.target.value)}
            placeholder="Search movies & TV shows…"
            aria-label="Search movies and TV shows"
            autoFocus
            style={{
              width:        '100%',
              padding:      '0.75rem 2.75rem 0.75rem 2.5rem',
              fontSize:     '1rem',
              borderRadius: '8px',
              borderWidth:  '1.5px',
              borderStyle:  'solid',
              borderColor:  'var(--input-border)',
              background:   'var(--input-bg)',
              color:        'var(--text)',
              outline:      'none',
              boxSizing:    'border-box',
              transition:   'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.boxShadow   = '0 0 0 2px var(--accent-ring), 0 0 20px rgba(0,212,255,0.1)'
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'var(--input-border)'
              e.currentTarget.style.boxShadow   = 'none'
            }}
          />

          {inputValue && (
            <button
              type="button"
              onClick={() => handleInputChange('')}
              aria-label="Clear search"
              style={{
                position:   'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-faint)',
                cursor:     'pointer', padding: '0.25rem', display: 'flex',
                alignItems: 'center', borderRadius: '50%',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* ── Empty / prompt state ─────────────────────────────────────────────── */}
      {!urlQ.trim() && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-faint)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Search for movies and TV shows
          </p>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>
            Type a title or keyword above to get started
          </p>
        </div>
      )}

      {/* ── Two-column layout: filter sidebar + results ──────────────────────── */}
      {urlQ.trim() && (
        <div className="search-results-grid">

          {/* Left: filter panel */}
          <aside className="search-filter-panel" aria-label="Filter results">
            <div style={{
              background:   'var(--bg-subtle)',
              borderWidth:  '1px',
              borderStyle:  'solid',
              borderColor:  'var(--border)',
              borderRadius: '10px',
              overflow:     'hidden',
            }}>
              <div style={{
                padding:         '0.625rem 0.875rem',
                borderBottom:    '1px solid var(--border)',
                background:      'var(--bg-muted)',
              }}>
                <p style={{
                  margin: 0, fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)',
                }}>
                  Filter
                </p>
              </div>

              <div className="search-filter-buttons" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {([
                  ['all',   'All Results', movieTotal + tvTotal],
                  ['movie', 'Movies',      movieTotal],
                  ['tv',    'TV Shows',    tvTotal],
                ] as [Filter, string, number][]).map(([type, label, count]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleFilterChange(type)}
                    style={urlType === type ? filterBtnActive : filterBtnBase}
                    aria-pressed={urlType === type}
                  >
                    <span>{label}</span>
                    {count > 0 && (
                      <span style={{
                        fontSize:    '0.72rem',
                        fontWeight:  700,
                        padding:     '0.1rem 0.45rem',
                        borderRadius:'999px',
                        background:  urlType === type ? 'rgba(0,0,0,0.2)' : 'var(--bg-muted)',
                        color:       urlType === type ? '#cfcfcf' : 'var(--text-faint)',
                        flexShrink:  0,
                      }}>
                        {count.toLocaleString()}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Right: results */}
          <section aria-label="Search results">

            {/* Loading skeleton rows */}
            {loading && Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)}

            {/* Error state */}
            {!loading && error && (
              <div style={{
                textAlign: 'center', padding: '2.5rem',
                color: 'var(--danger, #ff4d4d)',
                borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)',
                borderRadius: '8px',
              }}>
                {error}
              </div>
            )}

            {/* Results */}
            {!loading && !error && (
              <>
                {showMovieRows && movies.length > 0 && (
                  <div style={{ marginBottom: urlType === 'all' && tvShows.length > 0 ? '1.5rem' : 0 }}>
                    {urlType === 'all' && (
                      <p style={{
                        margin: '0 0 0.625rem',
                        fontSize: '0.72rem', fontWeight: 700,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: 'var(--accent)',
                      }}>
                        Movies
                        {movieTotal > movies.length
                          ? ` — showing ${movies.length.toLocaleString()} of ${movieTotal.toLocaleString()}`
                          : ` (${movieTotal.toLocaleString()})`}
                      </p>
                    )}
                    {movies.map(m => (
                      <ResultRow
                        key={`movie-${m.id}`}
                        href={`/media/movie/${m.id}`}
                        posterUrl={m.posterUrl}
                        title={m.title}
                        year={m.releaseDate?.slice(0, 4)}
                        typeLabel="Movie"
                        overview={m.overview}
                      />
                    ))}
                  </div>
                )}

                {showTVRows && tvShows.length > 0 && (
                  <div>
                    {urlType === 'all' && (
                      <p style={{
                        margin: '0 0 0.625rem',
                        fontSize: '0.72rem', fontWeight: 700,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: 'var(--violet)',
                      }}>
                        TV Shows
                        {tvTotal > tvShows.length
                          ? ` — showing ${tvShows.length.toLocaleString()} of ${tvTotal.toLocaleString()}`
                          : ` (${tvTotal.toLocaleString()})`}
                      </p>
                    )}
                    {tvShows.map(s => (
                      <ResultRow
                        key={`tv-${s.id}`}
                        href={`/media/tv/${s.id}`}
                        posterUrl={s.posterUrl}
                        title={s.name}
                        year={s.firstAirDate?.slice(0, 4)}
                        typeLabel="TV Show"
                        overview={s.overview}
                      />
                    ))}
                  </div>
                )}

                {/* Empty state — no results at all */}
                {!hasResults && urlQ.trim() && (
                  <div style={{
                    textAlign: 'center', padding: '3rem 1rem',
                    borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)',
                    borderRadius: '8px', color: 'var(--text-faint)',
                  }}>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      No results for &ldquo;{urlQ}&rdquo;
                    </p>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                      Try a different spelling or keyword.
                    </p>
                  </div>
                )}

                {/* Empty state — selected filter has no results but other type does */}
                {urlType !== 'all' && (
                  (urlType === 'movie' && movies.length === 0 && tvShows.length > 0) ||
                  (urlType === 'tv'    && tvShows.length === 0 && movies.length > 0)
                ) && (
                  <div style={{
                    textAlign: 'center', padding: '2.5rem 1rem',
                    borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)',
                    borderRadius: '8px', color: 'var(--text-faint)',
                  }}>
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      No {urlType === 'movie' ? 'movies' : 'TV shows'} found for &ldquo;{urlQ}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={() => handleFilterChange('all')}
                      style={{
                        background:  'none',
                        borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)',
                        borderRadius:'5px', color: 'var(--accent)', cursor: 'pointer',
                        fontSize:    '0.82rem', padding: '0.3rem 0.75rem',
                      }}
                    >
                      Show all results
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div className="skeleton" style={{
          height: '48px', maxWidth: '640px',
          borderRadius: '8px', marginBottom: '1.75rem',
        }} />
        {Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}
      </main>
    }>
      <SearchPageInner />
    </Suspense>
  )
}
