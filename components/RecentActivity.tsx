'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getMyRatings } from '@/lib/api'
import type { MyRatingItem } from '@/lib/api'
import HoverCarousel from './HoverCarousel'
import { getSession, signIn } from 'next-auth/react'

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

export default function RecentActivity() {
  const [ratings, setRatings] = useState<MyRatingItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [token, setToken] = useState<string | undefined>()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const checkAuthAndFetch = async () => {
      setLoading(true)
      const session = await getSession()
      if (session?.accessToken) {
        setToken(session.accessToken)
        try {
          const res = await getMyRatings(session.accessToken, 1)
          setRatings(res.data)
          setHasMore(res.pagination.page < res.pagination.totalPages)
        } catch (error) {
          console.error("Failed to fetch recent activity", error)
        }
      }
      setLoading(false)
    }
    checkAuthAndFetch()
  }, [isMounted])

  const handleScrollEnd = async () => {
    if (hasMore && !loading && token) {
      setLoading(true)
      try {
        const nextPage = page + 1
        const res = await getMyRatings(token, nextPage)
        setRatings(prev => {
          const existingIds = new Set(prev.map(r => r.id))
          const newRatings = res.data.filter(r => !existingIds.has(r.id))
          return [...prev, ...newRatings]
        })
        setPage(nextPage)
        setHasMore(res.pagination.page < res.pagination.totalPages)
      } catch (error) {
        console.error("Failed to load more activity", error)
      } finally {
        setLoading(false)
      }
    }
  }

  if (!isMounted) {
    return null
  }

  return (
    <section style={{ marginBottom: '3rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Your Recent Activity</h2>
      
      {!token ? (
        <div style={{
          padding: '2rem',
          border: '1px dashed var(--border)',
          borderRadius: '8px',
          textAlign: 'center',
          background: 'var(--bg-subtle)'
        }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Sign in to track your ratings and see your recent activity here.
          </p>
          <button
            onClick={() => signIn('tcss460')}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--accent)',
              color: 'var(--accent-text)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Sign In
          </button>
        </div>
      ) : ratings.length === 0 && !loading ? (
        <div style={{
          padding: '2rem',
          border: '1px dashed var(--border)',
          borderRadius: '8px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          You haven&apos;t rated anything yet. Start exploring to build your activity feed!
        </div>
      ) : (
        <HoverCarousel onScrollEnd={handleScrollEnd}>
          {ratings.map((item) => {
            const meta = item.metadata
            if (!meta) return null
            return (
              <Link key={item.id} href={`/media/${item.media_type}/${item.title_id}`} style={cardStyle}>
                {meta.poster_url ? (
                  <img
                    src={meta.poster_url}
                    alt={meta.title}
                    style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={posterPlaceholderStyle}>{meta.title}</div>
                )}
                <div style={cardBodyStyle}>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {meta.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem' }}>
                    <span style={{ color: '#eab308', fontSize: '0.85rem' }}>★</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      {item.rating}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Your Rating
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
          {loading && ratings.length > 0 && <div style={{ minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}
        </HoverCarousel>
      )}
    </section>
  )
}
