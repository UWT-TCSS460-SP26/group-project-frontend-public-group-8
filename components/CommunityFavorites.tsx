'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTopRated } from '@/lib/api'
import type { TopRatedItem } from '@/lib/api'
import HoverCarousel from './HoverCarousel'

const CARD_WIDTH = 150

function CardSkeleton() {
  return (
    <div style={{ minWidth: CARD_WIDTH, maxWidth: CARD_WIDTH, flexShrink: 0 }}>
      <div className="skeleton" style={{ width: '100%', aspectRatio: '2/3', borderRadius: '8px 8px 0 0' }} />
      <div style={{ padding: '0.5rem 0.6rem 0.6rem', background: 'var(--card-bg)', borderRadius: '0 0 8px 8px', border: '1px solid var(--border)', borderTop: 'none' }}>
        <div className="skeleton" style={{ height: '12px', width: '80%', marginBottom: '6px' }} />
        <div className="skeleton" style={{ height: '10px', width: '55%' }} />
      </div>
    </div>
  )
}

const tabBase: React.CSSProperties = {
  padding:      '0.3rem 0.875rem',
  borderRadius: '6px',
  borderWidth:  '1px',
  borderStyle:  'solid',
  borderColor:  'var(--border)',
  background:   'transparent',
  color:        'var(--text-muted)',
  fontSize:     '0.82rem',
  fontWeight:   600,
  cursor:       'pointer',
  transition:   'background 0.15s, color 0.15s, border-color 0.15s',
  letterSpacing:'0.03em',
}

const tabActive: React.CSSProperties = {
  ...tabBase,
  background:  'var(--violet)',
  color:       '#fff',
  borderColor: 'var(--violet)',
}

export default function CommunityFavorites() {
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie')
  const [items, setItems] = useState<TopRatedItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    setLoading(true)
    getTopRated(1, 20)
      .then(res => {
        setItems(res.data)
        setHasMore(res.pagination.page < res.pagination.totalPages)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleScrollEnd = async () => {
    if (!hasMore || loading) return
    setLoading(true)
    try {
      const next = page + 1
      const res = await getTopRated(next, 20)
      setItems(prev => {
        const existing = new Set(prev.map(i => `${i.media_type}-${i.title_id}`))
        return [...prev, ...res.data.filter(i => !existing.has(`${i.media_type}-${i.title_id}`))]
      })
      setPage(next)
      setHasMore(res.pagination.page < res.pagination.totalPages)
    } catch { /* silent */ } finally { setLoading(false) }
  }

  const filtered = items.filter(i => i.media_type === mediaType)
  const showSkeletons = loading && filtered.length === 0

  return (
    <section className="section-panel" style={{ marginBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 className="section-heading" style={{ margin: 0, color: 'var(--violet)' }}>Community Favorites</h2>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button onClick={() => setMediaType('movie')} style={mediaType === 'movie' ? tabActive : tabBase} aria-pressed={mediaType === 'movie'}>Movies</button>
          <button onClick={() => setMediaType('tv')} style={mediaType === 'tv' ? tabActive : tabBase} aria-pressed={mediaType === 'tv'}>TV Shows</button>
        </div>
      </div>

      <HoverCarousel onScrollEnd={handleScrollEnd}>
        {showSkeletons
          ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          : filtered.length === 0
            ? <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem', padding: '1rem 0' }}>No favorites yet — be the first to rate something!</p>
            : filtered.map(item => {
                const meta = item.metadata
                if (!meta) return null
                return (
                  <Link key={`${item.media_type}-${item.title_id}`}
                    href={`/media/${item.media_type}/${item.title_id}`}
                    className="media-card"
                    style={{ minWidth: CARD_WIDTH, maxWidth: CARD_WIDTH, flexShrink: 0 }}>
                    {meta.poster_url ? (
                      <img src={meta.poster_url} alt=""
                        style={{ width: '100%', height: 'auto', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--placeholder-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                        No poster
                      </div>
                    )}
                    <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.title}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.15rem 0 0.3rem' }}>{meta.year}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>★</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)' }}>{item.avgRating.toFixed(1)}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-faint)' }}>({item.ratingCount})</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
        {loading && filtered.length > 0 && (
          <div style={{ minWidth: CARD_WIDTH, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: '0.8rem' }}>
            Loading…
          </div>
        )}
      </HoverCarousel>
    </section>
  )
}
