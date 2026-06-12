'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { searchTVByGenre, searchMovieByGenre } from '@/lib/api'
import type { TVSearchResult, MovieSearchResult } from '@/lib/api'
import HoverCarousel from './HoverCarousel'

interface Props {
  genre: string | string[]
  title: string
  mediaType?: 'movie' | 'tv'
}

const CARD_WIDTH = 150

function CardSkeleton() {
  return (
    <div style={{ minWidth: CARD_WIDTH, maxWidth: CARD_WIDTH, flexShrink: 0 }}>
      <div className="skeleton" style={{ width: '100%', aspectRatio: '2/3', borderRadius: '8px 8px 0 0' }} />
      <div style={{ padding: '0.5rem 0.6rem 0.6rem', background: 'var(--card-bg)', borderRadius: '0 0 8px 8px', border: '1px solid var(--border)', borderTop: 'none' }}>
        <div className="skeleton" style={{ height: '12px', width: '80%', marginBottom: '6px' }} />
        <div className="skeleton" style={{ height: '10px', width: '40%' }} />
      </div>
    </div>
  )
}

export default function GenreCarousel({ genre, title, mediaType = 'tv' }: Props) {
  const [items, setItems] = useState<(TVSearchResult | MovieSearchResult)[]>([])
  const [page, setPage] = useState(2)      // pages 1+2 loaded on mount
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const genreKey = Array.isArray(genre) ? genre.join(',') : genre
  const fetchIdRef = useRef(0)

  // Preview area state
  const [activeIndex, setActiveIndex] = useState(0)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const displayIndex = hoverIndex ?? activeIndex
  const displayItem = items[displayIndex] ?? items[0] ?? null

  const searchFn = mediaType === 'movie' ? searchMovieByGenre : searchTVByGenre

  useEffect(() => {
    // Reset state and increment fetch ID to discard previous in-flight requests
    setItems([])
    setPage(2)
    setHasMore(true)
    setLoading(true)
    const fetchId = ++fetchIdRef.current

    const genres = Array.isArray(genre) ? genre : [genre]

    // Load pages 1 and 2 concurrently so each carousel starts with ~40 items
    Promise.all([
      ...genres.map(g => searchFn(g, 1)),
      ...genres.map(g => searchFn(g, 2)),
    ])
      .then((responses: any[]) => {
        if (fetchId !== fetchIdRef.current) return
        const combined = responses.flatMap(r => r.results)
        const unique = Array.from(new Map<number, TVSearchResult | MovieSearchResult>(
          combined.map((s: TVSearchResult | MovieSearchResult) => [s.id, s])
        ).values())
        setItems(unique)
        // hasMore is determined by the page-2 responses (second half of the array)
        // TMDB limit is 500 pages
        const page2 = responses.slice(genres.length)
        const maxPages = Math.min(500, Math.max(...page2.map(r => r.totalPages)))
        setHasMore(page2.some(r => r.page < maxPages))
      })
      .catch(() => { /* hide empty carousels via null render below */ })
      .finally(() => {
        if (fetchId === fetchIdRef.current) setLoading(false)
      })
  }, [genreKey, mediaType, searchFn, genre])

  const handleScrollEnd = async () => {
    if (!hasMore || loading) return
    const genres = Array.isArray(genre) ? genre : [genre]
    setLoading(true)
    try {
      const next = page + 1
      const responses: any[] = await Promise.all(genres.map(g => searchFn(g, next)))
      setItems(prev => {
        const existingIds = new Set(prev.map(s => s.id))
        const newItems = responses.flatMap(r => r.results).filter((s: TVSearchResult | MovieSearchResult) => !existingIds.has(s.id))
        return [...prev, ...newItems]
      })
      setPage(next)
      // TMDB limit is 500 pages
      const maxPages = Math.min(500, Math.max(...responses.map(r => r.totalPages)))
      setHasMore(responses.some(r => r.page < maxPages))
    } catch { /* silent */ } finally { setLoading(false) }
  }

  if (items.length === 0 && !loading) return null

  const genreSlug = Array.isArray(genre) ? genre.join(',') : genre
  const browseHref = `/genre/${genreSlug}?type=${mediaType}`

  return (
    <section
      className="section-panel"
      style={{ marginBottom: '2.5rem' }}
      onMouseLeave={() => setHoverIndex(null)}
    >
      {/* Clickable genre heading */}
      <div style={{ margin: '0 0 0.75rem' }}>
        <Link
          href={browseHref}
          className="genre-heading-link"
          aria-label={`Browse all ${title}`}
        >
          {title}
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </Link>
      </div>

      <HoverCarousel
        onScrollEnd={handleScrollEnd}
        onActiveIndexChange={setActiveIndex}
        hoverIndex={hoverIndex}
      >
        {loading && items.length === 0
          ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
          : items.map((item, i) => {
              const id = item.id
              const titleText = 'title' in item ? item.title : item.name
              const dateText = ('releaseDate' in item ? item.releaseDate : item.firstAirDate)?.slice(0, 4)

              return (
                <Link
                  key={id}
                  href={`/media/${mediaType}/${id}`}
                  className="media-card"
                  style={{ minWidth: CARD_WIDTH, maxWidth: CARD_WIDTH, flexShrink: 0 }}
                  onMouseEnter={() => setHoverIndex(i)}
                >
                  {item.posterUrl ? (
                    <Image
                      src={item.posterUrl}
                      alt={titleText}
                      width={150}
                      height={225}
                      style={{ width: '100%', height: 'auto', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--placeholder-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-faint)', padding: '0.5rem', textAlign: 'center' }}>
                      {titleText}
                    </div>
                  )}
                  <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {titleText}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                      {dateText}
                    </p>
                  </div>
                </Link>
              )
            })}
        {loading && items.length > 0 && (
          <div style={{ minWidth: CARD_WIDTH, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: '0.8rem' }}>
            Loading…
          </div>
        )}
      </HoverCarousel>

      {/* Fixed-height preview area — updates on hover (desktop) or active card (mobile) */}
      {displayItem && (
        <div className="genre-preview">
          <div className="genre-preview-content" key={displayItem.id}>
            <p className="genre-preview-title">{'title' in displayItem ? displayItem.title : displayItem.name}</p>
            <span className="genre-preview-year">
              {('releaseDate' in displayItem ? displayItem.releaseDate : displayItem.firstAirDate)?.slice(0, 4)}
            </span>
            {displayItem.overview && (
              <p className="genre-preview-desc">{displayItem.overview}</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
