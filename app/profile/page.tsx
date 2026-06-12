'use client'

import { useSession, signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import StarRating from '@/components/StarRating'
import ReviewForm from '@/components/ReviewForm'
import {
  getMyRatings,
  getMyReviews,
  deleteRating,
  updateReview,
  deleteReview,
  submitRating,
  type MyRatingItem,
  type MyReviewItem,
} from '@/lib/api'
import { signOutIfAuthError } from '@/lib/clientAuth'
import ConfirmModal from '@/components/ConfirmModal'

function RatingSkeleton() {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.875rem 1rem', background: 'var(--bg-subtle)' }}>
      <div className="skeleton" style={{ width: '50px', height: '75px', borderRadius: '4px', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: '14px', width: '55%', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '10px', width: '30%', marginBottom: '12px' }} />
        <div className="skeleton" style={{ height: '22px', width: '100px' }} />
      </div>
    </div>
  )
}

function ReviewSkeleton() {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem 1.25rem', background: 'var(--bg-subtle)' }}>
      <div className="skeleton" style={{ height: '14px', width: '40%', marginBottom: '8px' }} />
      <div className="skeleton" style={{ height: '10px', width: '20%', marginBottom: '16px' }} />
      <div className="skeleton" style={{ height: '12px', width: '100%', marginBottom: '6px' }} />
      <div className="skeleton" style={{ height: '12px', width: '80%' }} />
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '0.875rem 1rem',
  background: 'var(--bg-subtle)',
  display: 'flex',
  gap: '1rem',
  alignItems: 'flex-start',
}

const reviewCardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '1rem 1.25rem',
  background: 'var(--bg-subtle)',
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const token = session?.accessToken

  const [ratings, setRatings] = useState<MyRatingItem[]>([])
  const [ratingsPage, setRatingsPage] = useState(1)
  const [ratingsTotal, setRatingsTotal] = useState(0)
  const [ratingsTotalPages, setRatingsTotalPages] = useState(1)
  const [loadingRatings, setLoadingRatings] = useState(false)

  const [reviews, setReviews] = useState<MyReviewItem[]>([])
  const [reviewsPage, setReviewsPage] = useState(1)
  const [reviewsTotal, setReviewsTotal] = useState(0)
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1)
  const [loadingReviews, setLoadingReviews] = useState(false)

  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingReviewId, setEditingReviewId] = useState<number | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ type: 'rating' | 'review'; id: number } | null>(null)

  useEffect(() => {
    if (!token) return
    setInitialLoading(true)
    Promise.all([getMyRatings(token, 1), getMyReviews(token, 1)])
      .then(([r, rv]) => {
        setRatings(r.data)
        setRatingsTotal(r.pagination.total)
        setRatingsTotalPages(r.pagination.totalPages)
        setReviews(rv.data)
        setReviewsTotal(rv.pagination.total)
        setReviewsTotalPages(rv.pagination.totalPages)
      })
      .catch(e => {
        if (signOutIfAuthError(e)) return
        setError(e instanceof Error ? e.message : 'Failed to load profile data.')
      })
      .finally(() => setInitialLoading(false))
  }, [token])

  async function loadMoreRatings() {
    if (!token || loadingRatings || ratingsPage >= ratingsTotalPages) return
    setLoadingRatings(true)
    try {
      const next = ratingsPage + 1
      const r = await getMyRatings(token, next)
      setRatings(prev => [...prev, ...r.data])
      setRatingsPage(next)
    } catch (e) { signOutIfAuthError(e) } finally { setLoadingRatings(false) }
  }

  async function loadMoreReviews() {
    if (!token || loadingReviews || reviewsPage >= reviewsTotalPages) return
    setLoadingReviews(true)
    try {
      const next = reviewsPage + 1
      const rv = await getMyReviews(token, next)
      setReviews(prev => [...prev, ...rv.data])
      setReviewsPage(next)
    } catch (e) { signOutIfAuthError(e) } finally { setLoadingReviews(false) }
  }

  async function handleRatingChange(titleId: number, star: number, mediaType: 'movie' | 'tv' | null) {
    if (!token) return
    try {
      await submitRating(titleId, star, mediaType ?? 'movie', token)
      setRatings(prev => prev.map(r => r.title_id === titleId ? { ...r, rating: star } : r))
    } catch (e) { signOutIfAuthError(e) }
  }

  async function handleRatingDelete(titleId: number) {
    if (!token) return
    setPendingDelete(null)
    try {
      await deleteRating(titleId, token)
      setRatings(prev => prev.filter(r => r.title_id !== titleId))
      setRatingsTotal(n => Math.max(0, n - 1))
    } catch (e) { signOutIfAuthError(e) }
  }

  async function handleReviewEdit(reviewId: number, header: string, content: string) {
    if (!token) return
    setReviewError(null)
    setReviewSubmitting(true)
    try {
      const updated = await updateReview(reviewId, content, header, token)
      setReviews(prev => prev.map(r => r.id === updated.id ? { ...r, header: updated.header, content: updated.content } : r))
      setEditingReviewId(null)
    } catch (e) {
      if (signOutIfAuthError(e)) return
      setReviewError(e instanceof Error ? e.message : 'Could not update review.')
    } finally { setReviewSubmitting(false) }
  }

  async function handleReviewDelete(reviewId: number) {
    if (!token) return
    setPendingDelete(null)
    try {
      await deleteReview(reviewId, token)
      setReviews(prev => prev.filter(r => r.id !== reviewId))
      setReviewsTotal(n => Math.max(0, n - 1))
    } catch (e) { signOutIfAuthError(e) }
  }

  const sectionHeadingStyle: React.CSSProperties = {
    margin: '0 0 1rem',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--accent)',
  }

  if (status === 'loading') {
    return (
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[...Array(3)].map((_, i) => <RatingSkeleton key={i} />)}
        </div>
      </main>
    )
  }

  if (!session) {
    return (
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1rem' }}>
          Sign in to view your profile, ratings, and reviews.
        </p>
        <button onClick={() => signIn('tcss460')} className="btn-primary">
          Sign In
        </button>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontWeight: 800 }}>Profile</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>
          {session.user?.email}
        </p>
      </div>

      {error && <p role="alert" style={{ color: 'var(--error)', marginBottom: '1.5rem' }}>{error}</p>}

      {/* ── My Ratings ── */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={sectionHeadingStyle}>
          My Ratings{ratingsTotal > 0 ? ` (${ratingsTotal})` : ''}
        </h2>

        {initialLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[...Array(3)].map((_, i) => <RatingSkeleton key={i} />)}
          </div>
        ) : ratings.length === 0 ? (
          <div style={{ padding: '2rem', border: '1px dashed var(--border)', borderRadius: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            You haven&apos;t rated anything yet.{' '}
            <Link href="/" style={{ color: 'var(--accent)' }}>Start browsing</Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {ratings.map(item => (
                <div key={item.id} style={cardStyle}>
                  {item.metadata?.poster_url && (
                    <Image
                      src={item.metadata.poster_url}
                      alt={item.metadata.title}
                      width={48}
                      height={72}
                      style={{ borderRadius: '4px', flexShrink: 0, objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {item.metadata ? (
                      <Link href={`/media/${item.media_type ?? 'movie'}/${item.title_id}`}
                        style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.metadata.title}
                      </Link>
                    ) : (
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Title #{item.title_id}</span>
                    )}
                    {item.metadata && (
                      <p style={{ margin: '0.1rem 0 0.5rem', fontSize: '0.78rem', color: 'var(--text-faint)' }}>
                        {item.metadata.year}
                        {item.media_type && ` · ${item.media_type === 'tv' ? 'TV' : 'Movie'}`}
                      </p>
                    )}
                    <StarRating value={item.rating} onChange={star => handleRatingChange(item.title_id, star, item.media_type)} size={22} />
                  </div>
                  <button type="button" onClick={() => setPendingDelete({ type: 'rating', id: item.title_id })}
                    style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', flexShrink: 0 }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {ratingsPage < ratingsTotalPages && (
              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <button onClick={loadMoreRatings} disabled={loadingRatings} className="btn-ghost"
                  style={{ fontSize: '0.85rem' }}>
                  {loadingRatings ? 'Loading…' : `Load more (${ratingsTotal - ratings.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── My Reviews ── */}
      <section>
        <h2 style={{ ...sectionHeadingStyle, color: 'var(--violet)' }}>
          My Reviews{reviewsTotal > 0 ? ` (${reviewsTotal})` : ''}
        </h2>

        {initialLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[...Array(2)].map((_, i) => <ReviewSkeleton key={i} />)}
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ padding: '2rem', border: '1px dashed var(--border)', borderRadius: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            You haven&apos;t written any reviews yet.{' '}
            <Link href="/" style={{ color: 'var(--accent)' }}>Find something to review</Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {reviews.map(item => (
                <div key={item.id} style={reviewCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      {item.metadata ? (
                        <Link href={`/media/${item.media_type ?? 'movie'}/${item.title_id}`}
                          style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.metadata.title}
                        </Link>
                      ) : (
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Title #{item.title_id}</span>
                      )}
                      {item.metadata && (
                        <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: 'var(--text-faint)' }}>
                          {item.metadata.year}
                          {item.media_type && ` · ${item.media_type === 'tv' ? 'TV' : 'Movie'}`}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginLeft: '1rem' }}>
                      <button type="button"
                        onClick={() => { setEditingReviewId(item.id); setReviewError(null) }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                        Edit
                      </button>
                      <button type="button"
                        onClick={() => setPendingDelete({ type: 'review', id: item.id })}
                        style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                        Delete
                      </button>
                    </div>
                  </div>

                  {editingReviewId === item.id ? (
                    <ReviewForm
                      initialHeader={item.header ?? ''}
                      initialContent={item.content ?? ''}
                      submitting={reviewSubmitting}
                      error={reviewError}
                      onSubmit={(h, c) => handleReviewEdit(item.id, h, c)}
                      onCancel={() => { setEditingReviewId(null); setReviewError(null) }}
                      submitLabel="Save Changes"
                    />
                  ) : (
                    <>
                      {item.header && (
                        <p style={{ fontWeight: 700, margin: '0.625rem 0 0.4rem', fontSize: '1rem' }}>{item.header}</p>
                      )}
                      <p style={{ margin: '0 0 0.5rem', lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {item.content}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', margin: 0 }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                        {' · '}👍{item.upvotes} 👎{item.downvotes}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>

            {reviewsPage < reviewsTotalPages && (
              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <button onClick={loadMoreReviews} disabled={loadingReviews} className="btn-ghost"
                  style={{ fontSize: '0.85rem' }}>
                  {loadingReviews ? 'Loading…' : `Load more (${reviewsTotal - reviews.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <ConfirmModal
        isOpen={pendingDelete !== null}
        title={pendingDelete?.type === 'rating' ? 'Remove Rating' : 'Delete Review'}
        message={
          pendingDelete?.type === 'rating'
            ? 'Are you sure you want to remove this rating?'
            : 'Are you sure you want to delete this review? This cannot be undone.'
        }
        confirmLabel={pendingDelete?.type === 'rating' ? 'Remove' : 'Delete'}
        onConfirm={() => {
          if (!pendingDelete) return
          if (pendingDelete.type === 'rating') handleRatingDelete(pendingDelete.id)
          else handleReviewDelete(pendingDelete.id)
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  )
}
