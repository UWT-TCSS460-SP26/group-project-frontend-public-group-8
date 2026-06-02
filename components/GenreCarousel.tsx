'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { searchTVByGenre } from '@/lib/api'
import type { TVSearchResult } from '@/lib/api'
import HoverCarousel from './HoverCarousel'

interface Props {
  genre: string | string[]
  title: string
}

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
  textAlign: 'center',
  padding: '1rem'
}

const cardBodyStyle: React.CSSProperties = {
  padding: '0.5rem 0.6rem 0.6rem',
}

export default function GenreCarousel({ genre, title }: Props) {
  const [shows, setShows] = useState<TVSearchResult[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const genres = Array.isArray(genre) ? genre : [genre]

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      try {
        const responses = await Promise.all(
          genres.map(g => searchTVByGenre(g, 1))
        )
        
        const combinedResults = responses.flatMap(res => res.results)
        const uniqueResults = Array.from(new Map(combinedResults.map(show => [show.id, show])).values())
        
        setShows(uniqueResults)
        
        // If any of the genres have more pages, we'll allow fetching more
        const anyHasMore = responses.some(res => res.page < res.totalPages)
        setHasMore(anyHasMore)

      } catch (error) {
        console.error(`Failed to fetch ${title} shows`, error)
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [JSON.stringify(genres)]) // Effect dependencies need to handle array changes

  const handleScrollEnd = async () => {
    if (hasMore && !loading) {
      setLoading(true)
      try {
        const nextPage = page + 1
        const responses = await Promise.all(
          genres.map(g => searchTVByGenre(g, nextPage))
        )
        
        const combinedResults = responses.flatMap(res => res.results)

        setShows(prev => {
          const existingIds = new Set(prev.map(s => s.id))
          const newShows = combinedResults.filter(s => !existingIds.has(s.id))
          return [...prev, ...newShows]
        })
        
        setPage(nextPage)
        
        const anyHasMore = responses.some(res => res.page < res.totalPages)
        setHasMore(anyHasMore)

      } catch (error) {
        console.error(`Failed to load more ${title} shows`, error)
      } finally {
        setLoading(false)
      }
    }
  }

  if (shows.length === 0 && !loading) return null

  return (
    <section style={{ marginBottom: '3rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>{title}</h2>
      <HoverCarousel onScrollEnd={handleScrollEnd}>
        {shows.map((s) => (
          <Link key={s.id} href={`/media/tv/${s.id}`} style={cardStyle}>
            {s.posterUrl ? (
              <img
                src={s.posterUrl}
                alt={s.name}
                style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }}
              />
            ) : (
              <div style={posterPlaceholderStyle}>{s.name}</div>
            )}
            <div style={cardBodyStyle}>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.name}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                {s.firstAirDate?.slice(0, 4)}
              </p>
            </div>
          </Link>
        ))}
        {loading && <div style={{ minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}
      </HoverCarousel>
    </section>
  )
}
