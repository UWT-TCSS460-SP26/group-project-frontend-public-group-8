'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getMyRatings } from '@/lib/api'
import type { MyRatingItem } from '@/lib/api'
import HoverCarousel from './HoverCarousel'
import { getSession } from 'next-auth/react'
import SignInButton from './SignInButton'

const CARD_WIDTH = 150

function CardSkeleton() {
  return (
    <div style={{ minWidth: CARD_WIDTH, maxWidth: CARD_WIDTH, flexShrink: 0 }}>
      <div className="skeleton" style={{ width: '100%', aspectRatio: '2/3', borderRadius: '8px 8px 0 0' }} />
      <div style={{ padding: '0.5rem 0.6rem 0.6rem', background: 'var(--card-bg)', borderRadius: '0 0 8px 8px', border: '1px solid var(--border)', borderTop: 'none' }}>
        <div className="skeleton" style={{ height: '12px', width: '80%', marginBottom: '6px' }} />
        <div className="skeleton" style={{ height: '10px', width: '50%' }} />
      </div>
    </div>
  )
}

export default function RecentActivity() {
  const [ratings, setRatings] = useState<MyRatingItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [token, setToken] = useState<string | undefined>()
  const [isMounted, setIsMounted] = useState(false)
  const [callbackUrl, setCallbackUrl] = useState('/')

  useEffect(() => {
    setIsMounted(true)
    setCallbackUrl(window.location.href)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    let cancelled = false
    const run = async () => {
      setLoading(true)
      const session = await getSession()
      if (cancelled) return
      if (session?.accessToken) {
        setToken(session.accessToken)
        try {
          const res = await getMyRatings(session.accessToken, 1)
          if (!cancelled) {
            setRatings(res.data)
            setHasMore(res.pagination.page < res.pagination.totalPages)
          }
        } catch { /* silent */ }
      }
      if (!cancelled) setLoading(false)
    }
    run()
    return () => { cancelled = true }
  }, [isMounted])

  const handleScrollEnd = async () => {
    if (!hasMore || loading || !token) return
    setLoading(true)
    try {
      const next = page + 1
      const res = await getMyRatings(token, next)
      setRatings(prev => {
        const existing = new Set(prev.map(r => r.id))
        return [...prev, ...res.data.filter(r => !existing.has(r.id))]
      })
      setPage(next)
      setHasMore(res.pagination.page < res.pagination.totalPages)
    } catch { /* silent */ } finally { setLoading(false) }
  }

  if (!isMounted) return null

  return (
    <section className="section-panel" style={{ marginBottom: '3rem' }}>
      <h2 className="section-heading" style={{ marginBottom: '1rem' }}>Your Recent Activity</h2>

      {!token ? (
        <div style={{
          padding: '1.75rem 2rem',
          border: '1px dashed var(--border)',
          borderRadius: '8px',
          textAlign: 'center',
          background: 'var(--bg-subtle)',
        }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Sign in to track your ratings and see your recent activity here.
          </p>
          <SignInButton callbackUrl={callbackUrl} className="btn-primary">
            Sign In
          </SignInButton>
        </div>
      ) : loading && ratings.length === 0 ? (
        <HoverCarousel>
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </HoverCarousel>
      ) : ratings.length === 0 ? (
        <div style={{
          padding: '1.75rem 2rem',
          border: '1px dashed var(--border)',
          borderRadius: '8px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
        }}>
          You haven&apos;t rated anything yet. Start exploring to build your activity feed!
        </div>
      ) : (
        <HoverCarousel onScrollEnd={handleScrollEnd}>
          {ratings.map(item => {
            const meta = item.metadata
            if (!meta) return null
            return (
              <Link key={item.id} href={`/media/${item.media_type ?? 'movie'}/${item.title_id}`}
                className="media-card"
                style={{ minWidth: CARD_WIDTH, maxWidth: CARD_WIDTH, flexShrink: 0 }}>
                {meta.poster_url ? (
                  <img src={meta.poster_url} alt={meta.title}
                    style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--placeholder-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-faint)', padding: '0.5rem', textAlign: 'center' }}>
                    {meta.title}
                  </div>
                )}
                <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.82rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.title}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.3rem' }}>
                    <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>★</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)' }}>{item.rating}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-faint)' }}>/ 5</span>
                  </div>
                </div>
              </Link>
            )
          })}
          {loading && ratings.length > 0 && (
            <div style={{ minWidth: CARD_WIDTH, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: '0.8rem' }}>
              Loading…
            </div>
          )}
        </HoverCarousel>
      )}
    </section>
  )
}
