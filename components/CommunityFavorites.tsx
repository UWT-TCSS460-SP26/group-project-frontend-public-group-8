'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTopRated } from '@/lib/api'
import type { TopRatedItem } from '@/lib/api'
import HoverCarousel from './HoverCarousel'

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '8px',
  overflow: 'hidden',
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
  minWidth: '150px',
  maxWidth: '150px',
  flexShrink: 0,
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

const cardBodyStyle: React.CSSProperties = {
  padding: '0.5rem 0.6rem 0.6rem',
}

export default function CommunityFavorites() {
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie')
  
  const [items, setItems] = useState<TopRatedItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      try {
        const res = await getTopRated(1, 20)
        setItems(res.data)
        setHasMore(res.pagination.page < res.pagination.totalPages)
      } catch (error) {
        console.error("Failed to fetch community favorites", error)
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [])

  // Infinite Scroll Handler
  const handleScrollEnd = async () => {
    if (hasMore && !loading) {
      setLoading(true)
      try {
        const nextPage = page + 1
        const res = await getTopRated(nextPage, 20)
        setItems(prev => {
           // Prevent duplicates by checking title_id and media_type
           const existingIds = new Set(prev.map(i => `${i.media_type}-${i.title_id}`))
           const newItems = res.data.filter(i => !existingIds.has(`${i.media_type}-${i.title_id}`))
           return [...prev, ...newItems]
        })
        setPage(nextPage)
        setHasMore(res.pagination.page < res.pagination.totalPages)
      } catch (error) {
        console.error("Failed to load more favorites", error)
      } finally {
        setLoading(false)
      }
    }
  }

  const filteredItems = items.filter(item => {
    return item.media_type === mediaType
  })

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Community Favorites</h2>
        <select 
          value={mediaType} 
          onChange={(e) => setMediaType(e.target.value as 'movie' | 'tv')}
          style={{
            padding: '0.4rem 0.8rem',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            background: 'var(--background)',
            color: 'var(--foreground)',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          <option value="movie">Movies</option>
          <option value="tv">TV Shows</option>
        </select>
      </div>

      <HoverCarousel onScrollEnd={handleScrollEnd}>
        {filteredItems.length === 0 && !loading ? (
          <p style={{ color: 'var(--text-faint)' }}>No matching favorites found.</p>
        ) : (
          <>
            {filteredItems.map((item) => {
              const meta = item.metadata
              if (!meta) return null
              return (
                <Link key={`${item.media_type}-${item.title_id}`} href={`/media/${item.media_type}/${item.title_id}`} style={cardStyle}>
                  {meta.poster_url ? (
                    <img
                      src={meta.poster_url}
                      alt={meta.title}
                      style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={posterPlaceholderStyle}>No poster</div>
                  )}
                  <div style={cardBodyStyle}>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {meta.title}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                      {meta.year}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem' }}>
                      <span style={{ color: '#eab308', fontSize: '0.85rem' }}>★</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {item.avgRating.toFixed(1)}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        ({item.ratingCount})
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
            {loading && <div style={{ minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}
          </>
        )}
      </HoverCarousel>
    </section>
  )
}
