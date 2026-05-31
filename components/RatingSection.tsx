'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import StarRating from './StarRating'
import ReviewForm from './ReviewForm'
import {
  submitRating,
  deleteRating,
  createReview,
  updateReview,
  deleteReview,
  type Review,
  type ReviewPreview,
} from '@/lib/api'

interface RatingSectionProps {
  titleId: number
  mediaType: 'movie' | 'tv'
  initialReviews: ReviewPreview[]
  reviewCount: number
}

export default function RatingSection({
  titleId,
  mediaType,
  initialReviews,
  reviewCount,
}: RatingSectionProps) {
  const { data: session, status } = useSession()
  const token = session?.accessToken

  // ── Rating state ──────────────────────────────────────────────────────────
  const [currentRating, setCurrentRating] = useState<number | null>(null)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)

  // ── Review state ──────────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<ReviewPreview[]>(initialReviews)
  const [totalReviews, setTotalReviews] = useState(reviewCount)
  const [myReview, setMyReview] = useState<Review | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState(false)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const userId = (session?.user as { id?: number } | undefined)?.id

  // Fetch this user's existing rating and review once signed in
  const fetchMyContent = useCallback(async () => {
    if (!token || !userId) return

    // Fetch user's rating
    try {
      const { data } = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://tcss-460-group-7.onrender.com'}/v1/ratings/user/${userId}/title/${titleId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      ).then((r) => {
        if (r.status === 404) return { data: null }
        return r.json()
      })
      if (data) setCurrentRating(data.rating)
    } catch {
      // no existing rating is fine
    }

    // Fetch user's review from the title's review list
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://tcss-460-group-7.onrender.com'}/v1/reviews/title/${titleId}?limit=100`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (res.ok) {
        const body = await res.json()
        const mine = (body.data as Review[]).find((r) => r.authorId === userId)
        if (mine) setMyReview(mine)
      }
    } catch {
      // ignore
    }
  }, [token, userId, titleId])

  useEffect(() => {
    fetchMyContent()
  }, [fetchMyContent])

  // ── Rating handlers ────────────────────────────────────────────────────────

  async function handleRatingChange(star: number) {
    if (!token) return
    setRatingError(null)
    setRatingSubmitting(true)
    try {
      const { data } = await submitRating(titleId, star, token)
      setCurrentRating(data.rating)
    } catch (e) {
      setRatingError(e instanceof Error ? e.message : 'Could not save rating.')
    } finally {
      setRatingSubmitting(false)
    }
  }

  async function handleRatingDelete() {
    if (!token) return
    setRatingError(null)
    setRatingSubmitting(true)
    try {
      await deleteRating(titleId, token)
      setCurrentRating(null)
    } catch (e) {
      setRatingError(e instanceof Error ? e.message : 'Could not remove rating.')
    } finally {
      setRatingSubmitting(false)
    }
  }

  // ── Review handlers ────────────────────────────────────────────────────────

  async function handleReviewSubmit(header: string, content: string) {
    if (!token) return
    setReviewError(null)
    setReviewSubmitting(true)
    try {
      const created = await createReview(titleId, mediaType, content, header, token)
      setMyReview(created)
      setReviews((prev) => [
        {
          id: created.id,
          authorId: created.authorId,
          header: created.header,
          content: created.content,
          upvotes: created.upvotes,
          downvotes: created.downvotes,
          createdAt: created.createdAt,
          author: created.author ?? null,
        },
        ...prev,
      ])
      setTotalReviews((n) => n + 1)
      setShowReviewForm(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not post review.'
      if (msg.includes('409')) {
        setReviewError('You have already reviewed this title. Refresh to see your review.')
      } else if (msg.includes('401')) {
        setReviewError('Your session expired. Please sign in again.')
      } else {
        setReviewError(msg)
      }
    } finally {
      setReviewSubmitting(false)
    }
  }

  async function handleReviewEdit(header: string, content: string) {
    if (!token || !myReview) return
    setReviewError(null)
    setReviewSubmitting(true)
    try {
      const updated = await updateReview(myReview.id, content, header, token)
      setMyReview(updated)
      setReviews((prev) =>
        prev.map((r) =>
          r.id === updated.id
            ? { ...r, header: updated.header, content: updated.content }
            : r,
        ),
      )
      setEditingReview(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not update review.'
      setReviewError(msg.includes('401') ? 'Session expired. Please sign in again.' : msg)
    } finally {
      setReviewSubmitting(false)
    }
  }

  async function handleReviewDelete() {
    if (!token || !myReview) return
    if (!confirm('Delete your review?')) return
    setReviewSubmitting(true)
    try {
      await deleteReview(myReview.id, token)
      setReviews((prev) => prev.filter((r) => r.id !== myReview.id))
      setTotalReviews((n) => Math.max(0, n - 1))
      setMyReview(null)
    } catch {
      // ignore
    } finally {
      setReviewSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (status === 'loading') {
    return <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>Loading…</p>
  }

  return (
    <div>
      {/* ── Rating control ── */}
      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Your Rating</h3>

        {!token ? (
          <a
            href="/api/auth/signin"
            style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              textDecoration: 'none',
            }}
            aria-label="Sign in to rate this title"
          >
            Sign in to rate
          </a>
        ) : (
          <div>
            <StarRating
              value={currentRating}
              onChange={handleRatingChange}
              disabled={ratingSubmitting}
            />
            {currentRating !== null && (
              <button
                type="button"
                onClick={handleRatingDelete}
                disabled={ratingSubmitting}
                style={{
                  marginTop: '0.5rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-faint)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Remove rating
              </button>
            )}
            {ratingError && (
              <p role="alert" style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {ratingError}
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Reviews ── */}
      <section>
        <h2 style={{ marginBottom: '1rem' }}>
          Community Reviews{totalReviews > 0 ? ` (${totalReviews})` : ''}
        </h2>

        {/* Write / edit review */}
        {token && !myReview && !showReviewForm && (
          <button
            type="button"
            onClick={() => setShowReviewForm(true)}
            style={{
              marginBottom: '1.5rem',
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
            Write a Review
          </button>
        )}

        {token && !myReview && showReviewForm && (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Write a Review</h3>
            <ReviewForm
              submitting={reviewSubmitting}
              error={reviewError}
              onSubmit={handleReviewSubmit}
              onCancel={() => { setShowReviewForm(false); setReviewError(null) }}
            />
          </div>
        )}

        {!token && (
          <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <a
              href="/api/auth/signin"
              style={{ color: 'var(--accent)', textDecoration: 'underline' }}
              aria-label="Sign in to write a review"
            >
              Sign in
            </a>{' '}
            to write a review.
          </p>
        )}

        {/* User's own review */}
        {myReview && (
          <div
            style={{
              border: '2px solid var(--accent)',
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>Your review</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => { setEditingReview(true); setReviewError(null) }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleReviewDelete}
                  disabled={reviewSubmitting}
                  style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Delete
                </button>
              </div>
            </div>

            {editingReview ? (
              <ReviewForm
                initialHeader={myReview.header ?? ''}
                initialContent={myReview.content ?? ''}
                submitting={reviewSubmitting}
                error={reviewError}
                onSubmit={handleReviewEdit}
                onCancel={() => { setEditingReview(false); setReviewError(null) }}
                submitLabel="Save Changes"
              />
            ) : (
              <>
                {myReview.header && (
                  <p style={{ fontWeight: 700, margin: '0 0 0.5rem', fontSize: '1rem' }}>{myReview.header}</p>
                )}
                <p style={{ margin: '0 0 0.5rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{myReview.content}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', margin: 0 }}>
                  {new Date(myReview.createdAt).toLocaleDateString()}
                  {' · '}↑{myReview.upvotes} ↓{myReview.downvotes}
                </p>
              </>
            )}
          </div>
        )}

        {/* Community reviews */}
        {reviews.length === 0 && !myReview ? (
          <p style={{ color: 'var(--text-faint)' }}>No reviews yet. Be the first!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews
              .filter((r) => r.id !== myReview?.id)
              .map((r) => (
                <div
                  key={r.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '1rem 1.25rem',
                  }}
                >
                  {r.header && (
                    <p style={{ fontWeight: 700, margin: '0 0 0.5rem', fontSize: '1rem' }}>{r.header}</p>
                  )}
                  {r.content && (
                    <p style={{ margin: '0 0 0.75rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                      {r.content}
                    </p>
                  )}
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', margin: 0 }}>
                    {r.author ? (r.author.display_name ?? r.author.username) : 'Anonymous'}
                    {' · '}
                    {new Date(r.createdAt).toLocaleDateString()}
                    {' · '}
                    ↑{r.upvotes} ↓{r.downvotes}
                  </p>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  )
}
