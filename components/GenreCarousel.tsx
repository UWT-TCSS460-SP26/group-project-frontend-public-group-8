'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { searchTVByGenre } from '@/lib/api'
import type { TVSearchResult } from '@/lib/api'
import HoverCarousel from './HoverCarousel'

interface Props {
  genre: string | string[]
  title: string
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

export default function GenreCarousel({ genre, title }: Props) {
  const [shows, setShows] = useState<TVSearchResult[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const genreKey = Array.isArray(genre) ? genre.join(',') : genre
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true

    const genres = Array.isArray(genre) ? genre : [genre]
    setLoading(true)
    Promise.all(genres.map(g => searchTVByGenre(g, 1)))
      .then(responses => {
        const combined = responses.flatMap(r => r.results)
        const unique = Array.from(new Map(combined.map(s => [s.id, s])).values())
        setShows(unique)
        setHasMore(responses.some(r => r.page < r.totalPages))
      })
      .catch(() => { /* hide empty carousels via null render below */ })
      .finally(() => setLoading(false))
  // genreKey is a stable string derived from the prop; intentional dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genreKey])

  const handleScrollEnd = async () => {
    if (!hasMore || loading) return
    const genres = Array.isArray(genre) ? genre : [genre]
    setLoading(true)
    try {
      const next = page + 1
      const responses = await Promise.all(genres.map(g => searchTVByGenre(g, next)))
      setShows(prev => {
        const existingIds = new Set(prev.map(s => s.id))
        return [...prev, ...responses.flatMap(r => r.results).filter(s => !existingIds.has(s.id))]
      })
      setPage(next)
      setHasMore(responses.some(r => r.page < r.totalPages))
    } catch { /* silent */ } finally { setLoading(false) }
  }

  if (shows.length === 0 && !loading) return null

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h3 className="section-heading" style={{ margin: '0 0 0.75rem' }}>
        {title}
      </h3>
      <HoverCarousel onScrollEnd={handleScrollEnd}>
        {loading && shows.length === 0
          ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          : shows.map(s => (
            <Link key={s.id} href={`/media/tv/${s.id}`} className="media-card"
              style={{ minWidth: CARD_WIDTH, maxWidth: CARD_WIDTH, flexShrink: 0 }}>
              {s.posterUrl ? (
                <img src={s.posterUrl} alt={s.name}
                  style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--placeholder-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-faint)', padding: '0.5rem', textAlign: 'center' }}>
                  {s.name}
                </div>
              )}
              <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
                <p style={{ fontWeight: 600, fontSize: '0.82rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.name}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                  {s.firstAirDate?.slice(0, 4)}
                </p>
              </div>
            </Link>
          ))}
        {loading && shows.length > 0 && (
          <div style={{ minWidth: CARD_WIDTH, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: '0.8rem' }}>
            Loading…
          </div>
        )}
      </HoverCarousel>
    </section>
  )
}
