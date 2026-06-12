'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { searchTVByGenre, searchMovieByGenre } from '@/lib/api'
import type { TVSearchResult, MovieSearchResult } from '@/lib/api'
import { useMedia } from '@/lib/MediaContext'

const GENRE_TITLES: Record<string, string> = {
  // Legacy/Combined Slugs
  action_adventure: 'Action & Adventure',
  sci_fi_fantasy:   'Sci-Fi & Fantasy',
  war_politics:     'War & Politics',
  'Action,Adventure': 'Action & Adventure',
  'family,kids':    'Kids & Family',
  
  // Individual Verified Slugs
  Action:           'Action',
  Adventure:        'Adventure',
  Kids:             'Kids',
  Family:           'Family',
  
  // Common Slugs
  'Science Fiction': 'Science Fiction',
  Fantasy:          'Fantasy',
  War:              'War',
  Animation:        'Animation',
  Comedy:           'Comedy',
  Crime:            'Crime',
  Documentary:      'Documentary',
  Drama:            'Drama',
  Mystery:          'Mystery',
  News:             'News',
  Soap:             'Soap',
  Talk:             'Talk',
  Western:          'Western',
  History:          'History',
  Horror:           'Horror',
  Music:            'Music',
  Romance:          'Romance',
  Thriller:         'Thriller',
  'TV Movie':       'TV Movie',
  Reality:          'Reality',
}

function formatSlug(slug: string): string {
  if (GENRE_TITLES[slug]) return GENRE_TITLES[slug]
  
  // Fallback: split by comma (combined) and join with pretty titles
  return slug.split(',').map(part => {
    if (GENRE_TITLES[part]) return GENRE_TITLES[part]
    return part.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }).join(' & ')
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
  const { mediaType, setMediaType, isInitialized } = useMedia()
  const params  = useParams() ?? {}
  const rawSlug = params.slug
  const slug    = typeof rawSlug === 'string' ? rawSlug : Array.isArray(rawSlug) ? rawSlug[0] : ''

  const router       = useRouter()
  const searchParams = useSearchParams()

  const typeParam = searchParams?.get('type')
  const pageParam = parseInt(searchParams?.get('page') ?? '1', 10)
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam

  // If URL has a type that differs from context, update context on mount
  useEffect(() => {
    if (typeParam === 'movie' || typeParam === 'tv') {
      if (typeParam !== mediaType) {
        setMediaType(typeParam as 'movie' | 'tv')
      }
    }
  }, [typeParam, mediaType, setMediaType])

  // When context changes, update URL to keep in sync
  useEffect(() => {
    const currentType = searchParams?.get('type')
    if (currentType !== mediaType) {
      const p = new URLSearchParams(searchParams?.toString())
      p.set('type', mediaType)
      router.replace(`/genre/${slug}?${p.toString()}`)
    }
  }, [mediaType, router, searchParams, slug])

  const pageTitle = formatSlug(slug)

  const [items, setItems]               = useState<(TVSearchResult | MovieSearchResult)[]>([])
  const [totalPages, setTotalPages]     = useState(1)
  const [totalResults, setTotalResults] = useState<number | null>(null)

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const fetchIdRef = useRef(0)

  useEffect(() => {
    const genres  = slug.split(',').filter(Boolean)
    const fetchId = ++fetchIdRef.current

    setLoading(true)
    setError(null)
    setItems([])

    const fetchPromises = mediaType === 'movie'
      ? genres.map(g => searchMovieByGenre(g, currentPage))
      : genres.map(g => searchTVByGenre(g, currentPage))

    Promise.all(fetchPromises)
      .then((responses: (any)[]) => {
        if (fetchId !== fetchIdRef.current) return
        const combined = responses.flatMap(r => r.results)
        const unique = Array.from(new Map<number, TVSearchResult | MovieSearchResult>(
          combined.map((s: TVSearchResult | MovieSearchResult) => [s.id, s])
        ).values())
        setItems(unique)
        // TMDB limits results to 500 pages
        const maxPages = Math.min(500, Math.max(1, ...responses.map(r => r.totalPages)))
        setTotalPages(maxPages)
        setTotalResults(responses.reduce((sum, r) => sum + r.totalResults, 0))
      })
      .catch(() => {
        if (fetchId !== fetchIdRef.current) return
        setError(`Failed to load ${mediaType === 'tv' ? 'TV shows' : 'movies'}. Please try again.`)
      })
      .finally(() => {
        if (fetchId === fetchIdRef.current) setLoading(false)
      })
  }, [slug, currentPage, mediaType])

  const navigateTo = useCallback((newPage: number) => {
    const p = new URLSearchParams()
    p.set('type', mediaType)
    if (newPage !== 1)   p.set('page', String(newPage))
    const qs = p.toString()
    router.push(`/genre/${slug}${qs ? `?${qs}` : ''}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [slug, router, mediaType])

  const paginationPages = getPaginationPages(currentPage, totalPages)

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

  if (!isInitialized) return null

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-orbitron, Orbitron, monospace)',
          fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
          fontWeight: 900,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          textShadow: '0 0 14px rgba(0,212,255,0.85), 0 0 36px rgba(0,212,255,0.4)',
          margin: 0,
        }}>
          {pageTitle}
        </h1>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {mediaType === 'tv' ? 'TV Shows' : 'Movies'}
          {totalResults !== null ? ` (${totalResults.toLocaleString()})` : ''}
        </span>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="genre-results-grid">
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
        <div className="genre-results-grid">
          {items.map(item => {
            const id = item.id
            const title = 'title' in item ? item.title : item.name
            const date = ('releaseDate' in item ? item.releaseDate : item.firstAirDate)?.slice(0, 4)

            return (
              <Link key={id} href={`/media/${mediaType}/${id}`} className="media-card" style={{ display: 'block' }}>
                {item.posterUrl
                  ? <Image src={item.posterUrl} alt={title} width={150} height={225} style={{ width: '100%', height: 'auto', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--placeholder-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-faint)', padding: '0.5rem', textAlign: 'center' }}>{title}</div>
                }
                <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>{date}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-faint)', fontSize: '0.9rem', border: '1px dashed var(--border)', borderRadius: '8px' }}>
          No {mediaType === 'tv' ? 'TV shows' : 'movies'} found{currentPage > 1 ? ` on page ${currentPage}` : ' for this genre'}.
        </div>
      )}

      {/* Pagination controls */}
      {!loading && !error && totalPages > 1 && (
        <nav
          aria-label="Pagination"
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem', marginTop: '2rem', flexWrap: 'wrap' }}
        >
          <button
            onClick={() => navigateTo(currentPage - 1)}
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
                  onClick={() => navigateTo(p as number)}
                  aria-label={`Page ${p}`}
                  aria-current={p === currentPage ? 'page' : undefined}
                  style={p === currentPage ? pgActive : pgBase}
                >
                  {p}
                </button>
              )
          )}

          <button
            onClick={() => navigateTo(currentPage + 1)}
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
