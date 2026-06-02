'use client'

import { useSession, signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
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

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const token = session?.accessToken

  const [ratings, setRatings] = useState<MyRatingItem[]>([])
  const [reviews, setReviews] = useState<MyReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingReviewId, setEditingReviewId] = useState<number | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    Promise.all([getMyRatings(token), getMyReviews(token)])
      .then(([r, rv]) => {
        setRatings(r.data)
        setReviews(rv.data)
      })
      .catch((e) => {
        // An expired/invalid token signs the user out instead of showing a 401
        if (signOutIfAuthError(e)) return
        setError(e instanceof Error ? e.message : 'Failed to load profile data.')
      })
      .finally(() => setLoading(false))
  }, [token])

  async function handleRatingChange(titleId: number, star: number) {
    if (!token) return
    try {
      const item = ratings.find((r) => r.title_id === titleId)
      await submitRating(titleId, star, item?.media_type ?? 'movie', token)
      setRatings((prev) => prev.map((r) => (r.title_id === titleId ? { ...r, rating: star } : r)))
    } catch (e) {
      signOutIfAuthError(e)
    }
  }

  async function handleRatingDelete(titleId: number) {
    if (!token) return
    try {
      await deleteRating(titleId, token)
      setRatings((prev) => prev.filter((r) => r.title_id !== titleId))
    } catch (e) {
      signOutIfAuthError(e)
    }
  }

  async function handleReviewEdit(reviewId: number, header: string, content: string) {
    if (!token) return
    setReviewError(null)
    setReviewSubmitting(true)
    try {
      const updated = await updateReview(reviewId, content, header, token)
      setReviews((prev) =>
        prev.map((r) =>
          r.id === updated.id ? { ...r, header: updated.header, content: updated.content } : r,
        ),
      )
      setEditingReviewId(null)
    } catch (e) {
      if (signOutIfAuthError(e)) return
      setReviewError(e instanceof Error ? e.message : 'Could not update review.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  async function handleReviewDelete(reviewId: number) {
    if (!token || !confirm('Delete this review?')) return
    try {
      await deleteReview(reviewId, token)
      setReviews((prev) => prev.filter((r) => r.id !== reviewId))
    } catch (e) {
      signOutIfAuthError(e)
    }
  }

  if (status === 'loading') {
    return (
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <p style={{ color: 'var(--text-faint)' }}>Loading…</p>
      </main>
    )
  }

  if (!session) {
    return (
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Sign in to view your profile.
        </p>
        <button
          onClick={() => signIn('tcss460')}
          style={{
            padding: '0.5rem 1.25rem',
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign In
        </button>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>Profile</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        {session.user?.email}
      </p>

      {loading && <p style={{ color: 'var(--text-faint)' }}>Loading your activity…</p>}
      {error && <p style={{ color: 'var(--error)' }}>{error}</p>}

      {!loading && !error && (
        <>
          {/* ── My Ratings ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>
              My Ratings{ratings.length > 0 ? ` (${ratings.length})` : ''}
            </h2>

            {ratings.length === 0 ? (
              <p style={{ color: 'var(--text-faint)' }}>You haven&apos;t rated anything yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {ratings.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'flex-start',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '0.875rem 1rem',
                    }}
                  >
                    {item.metadata?.poster_url && (
                      <img
                        src={item.metadata.poster_url}
                        alt={item.metadata.title}
                        style={{ width: '50px', borderRadius: '4px', flexShrink: 0 }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      {item.metadata ? (
                        <Link
                          href={`/media/${item.media_type ?? 'movie'}/${item.title_id}`}
                          style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}
                        >
                          {item.metadata.title}
                        </Link>
                      ) : (
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>
                          Title #{item.title_id}
                        </span>
                      )}
                      {item.metadata && (
                        <p style={{ margin: '0.1rem 0 0.4rem', fontSize: '0.8rem', color: 'var(--text-faint)' }}>
                          {item.metadata.year}
                          {item.media_type && ` · ${item.media_type === 'tv' ? 'TV Show' : 'Movie'}`}
                        </p>
                      )}
                      <StarRating
                        value={item.rating}
                        onChange={(star) => handleRatingChange(item.title_id, star)}
                        size={20}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRatingDelete(item.title_id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-faint)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        flexShrink: 0,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── My Reviews ── */}
          <section>
            <h2 style={{ marginBottom: '1rem' }}>
              My Reviews{reviews.length > 0 ? ` (${reviews.length})` : ''}
            </h2>

            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-faint)' }}>You haven&apos;t written any reviews yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviews.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '1rem 1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        {item.metadata ? (
                          <Link
                            href={`/media/${item.media_type ?? 'movie'}/${item.title_id}`}
                            style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}
                          >
                            {item.metadata.title}
                          </Link>
                        ) : (
                          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Title #{item.title_id}</span>
                        )}
                        {item.metadata && (
                          <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: 'var(--text-faint)' }}>
                            {item.metadata.year}
                            {item.media_type && ` · ${item.media_type === 'tv' ? 'TV Show' : 'Movie'}`}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => { setEditingReviewId(item.id); setReviewError(null) }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewDelete(item.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
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
                          <p style={{ fontWeight: 700, margin: '0 0 0.4rem', fontSize: '1rem' }}>{item.header}</p>
                        )}
                        <p style={{ margin: '0 0 0.5rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                          {item.content}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', margin: 0 }}>
                          {new Date(item.createdAt).toLocaleDateString()}
                          {' · '}↑{item.upvotes} ↓{item.downvotes}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}
