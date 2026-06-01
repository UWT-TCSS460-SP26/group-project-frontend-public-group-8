'use client'

import { useSession, signIn } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import StarRating from './StarRating'
import ReviewForm from './ReviewForm'
import {
  submitRating,
  deleteRating,
  createReview,
  updateReview,
  deleteReview,
  resolveAuthorId,
  type ReviewPreview,
} from '@/lib/api'

interface OwnedReview {
  id: number
  title_id: number
  header: string | null
  content: string | null
  upvotes: number
  downvotes: number
  createdAt: string
}

interface RatingSectionProps {
  titleId: number
  mediaType: 'movie' | 'tv'
  initialReviews: ReviewPreview[]
  reviewCount: number
}

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://tcss-460-group-7.onrender.com'

export default function RatingSection({
  titleId,
  mediaType,
  initialReviews,
  reviewCount,
}: RatingSectionProps) {
  const { data: session, status } = useSession()
  const token = session?.accessToken
  const authorId = session?.authorId

  // ── Rating state ──────────────────────────────────────────────────────────
  const [currentRating, setCurrentRating] = useState<number | null>(null)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)

  // ── Review state ──────────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<ReviewPreview[]>(initialReviews)
  const [totalReviews, setTotalReviews] = useState(reviewCount)
  const [myReview, setMyReview] = useState<OwnedReview | null>(null)
  const [loadingMyContent, setLoadingMyContent] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState(false)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  // ── Fetch existing rating + review whenever the token/authorId changes ──────
  const fetchMyContent = useCallback(async (tok: string, uid: number) => {
    // Rating: direct lookup by authorId + titleId
    try {
      const res = await fetch(`${BASE}/v1/ratings/user/${uid}/title/${titleId}`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (res.ok) {
        const body = await res.json()
        const rating = body?.data?.rating ?? body?.rating
        if (rating != null) setCurrentRating(Number(rating))
      }
    } catch { /* no rating is fine */ }

    // Review: match authorId against this title's review list.
    // First check the reviews already on the page; if not found, paginate
    // GET /v1/reviews/title/{titleId} to find older reviews.
    try {
      const findInList = (list: ReviewPreview[]) =>
        list.find((r) => Number(r.authorId) === uid) ?? null

      const fromInitial = findInList(initialReviews)
      if (fromInitial) {
        setMyReview({
          id: fromInitial.id,
          title_id: titleId,
          header: fromInitial.header ?? null,
          content: fromInitial.content ?? null,
          upvotes: fromInitial.upvotes,
          downvotes: fromInitial.downvotes,
          createdAt: fromInitial.createdAt,
        })
        setReviews((prev) => prev.filter((r) => r.id !== fromInitial.id))
        return
      }

      // Not in recent list — paginate all reviews for this title
      let page = 1
      outer: while (true) {
        const res = await fetch(
          `${BASE}/v1/reviews/title/${titleId}?page=${page}&limit=25`,
          { headers: { Authorization: `Bearer ${tok}` } },
        )
        if (!res.ok) break
        const body = await res.json()
        const found = findInList(body.data ?? [])
        if (found) {
          setMyReview({
            id: found.id,
            title_id: titleId,
            header: found.header ?? null,
            content: found.content ?? null,
            upvotes: found.upvotes,
            downvotes: found.downvotes,
            createdAt: found.createdAt,
          })
          setReviews((prev) => prev.filter((r) => r.id !== found.id))
          break outer
        }
        if (page >= (body.pagination?.totalPages ?? 1)) break
        page++
      }
    } catch { /* no review is fine */ }
  }, [titleId, initialReviews])

  useEffect(() => {
    if (!token) {
      setCurrentRating(null)
      setMyReview(null)
      setLoadingMyContent(false)
      setShowReviewForm(false)
      setEditingReview(false)
      return
    }
    let cancelled = false
    setLoadingMyContent(true)
    ;(async () => {
      // authorId comes from the session when available; otherwise resolve it
      // on the fly so existing sessions work without re-login.
      const uid = authorId ?? (await resolveAuthorId(token))
      if (cancelled || !uid) {
        if (!cancelled) setLoadingMyContent(false)
        return
      }
      await fetchMyContent(token, uid)
      if (!cancelled) setLoadingMyContent(false)
    })()
    return () => { cancelled = true }
  }, [token, authorId, fetchMyContent])

  // ── Rating handlers ────────────────────────────────────────────────────────

  async function handleRatingChange(star: number) {
    if (!token) return
    setRatingError(null)
    setRatingSubmitting(true)
    try {
      const { data } = await submitRating(titleId, star, mediaType, token)
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
      const owned: OwnedReview = {
        id: created.id,
        title_id: created.title_id,
        header: created.header,
        content: created.content,
        upvotes: created.upvotes,
        downvotes: created.downvotes,
        createdAt: created.createdAt,
      }
      setMyReview(owned)
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
        // Already reviewed — fetch and surface the existing review
        setShowReviewForm(false)
        setReviewError(null)
        if (token) {
          const uid = authorId ?? (await resolveAuthorId(token))
          if (uid) await fetchMyContent(token, uid)
        }
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
      const owned: OwnedReview = {
        id: updated.id,
        title_id: updated.title_id,
        header: updated.header,
        content: updated.content,
        upvotes: updated.upvotes,
        downvotes: updated.downvotes,
        createdAt: updated.createdAt,
      }
      setMyReview(owned)
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
    } catch { /* silent */ } finally {
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
          <button
            type="button"
            onClick={() => signIn('tcss460', { callbackUrl: window.location.href })}
            style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              background: 'transparent',
              cursor: 'pointer',
            }}
            aria-label="Sign in to rate this title"
          >
            Sign in to rate
          </button>
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

        {token && !myReview && !showReviewForm && !loadingMyContent && (
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

        {token && !myReview && showReviewForm && !loadingMyContent && (
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
            <button
              type="button"
              onClick={() => signIn('tcss460', { callbackUrl: window.location.href })}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
              aria-label="Sign in to write a review"
            >
              Sign in
            </button>{' '}
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
