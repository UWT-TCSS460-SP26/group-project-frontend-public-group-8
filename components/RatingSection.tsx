'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import StarRating from './StarRating'
import ReviewForm from './ReviewForm'
import ReviewVotes from './ReviewVotes'
import SignInButton from './SignInButton'
import {
  submitRating,
  deleteRating,
  createReview,
  updateReview,
  deleteReview,
  getMyRatings,
  getMyReviews,
  type ReviewPreview,
} from '@/lib/api'
import { signOutIfAuthError } from '@/lib/clientAuth'

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

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '1.125rem 1.25rem',
  background: 'var(--bg-subtle)',
}

const ownCardStyle: React.CSSProperties = {
  ...cardStyle,
  border: '1px solid var(--accent)',
  background: 'rgba(0, 229, 255, 0.04)',
}

export default function RatingSection({
  titleId,
  mediaType,
  initialReviews,
  reviewCount,
}: RatingSectionProps) {
  const { data: session, status } = useSession()
  const token = session?.accessToken

  const [currentRating, setCurrentRating] = useState<number | null>(null)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)

  const [reviews, setReviews] = useState<ReviewPreview[]>(initialReviews)
  const [totalReviews, setTotalReviews] = useState(reviewCount)
  const [myReview, setMyReview] = useState<OwnedReview | null>(null)
  const [loadingMyContent, setLoadingMyContent] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState(false)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  
  const [callbackUrl, setCallbackUrl] = useState('/')

  useEffect(() => {
    setCallbackUrl(window.location.href)
  }, [])

  // Workaround: no GET /v1/reviews/me/title/{id} endpoint exists yet.
  // Once the backend adds it, replace these paginated loops with a single fetch.
  const fetchMyContent = useCallback(async (tok: string) => {
    const matches = (titleIdField: number, metaId: number | undefined) =>
      Number(titleIdField) === titleId || Number(metaId) === titleId

    try {
      let page = 1
      outer: while (true) {
        const body = await getMyRatings(tok, page)
        for (const r of body.data ?? []) {
          if (matches(r.title_id, r.metadata?.id)) {
            setCurrentRating(Number(r.rating))
            break outer
          }
        }
        if (page >= (body.pagination?.totalPages ?? 1)) break
        page++
      }
    } catch (e) { signOutIfAuthError(e) }

    try {
      let page = 1
      outer: while (true) {
        const body = await getMyReviews(tok, page)
        for (const r of body.data ?? []) {
          if (matches(r.title_id, r.metadata?.id)) {
            setMyReview({
              id: r.id,
              title_id: Number(r.title_id),
              header: r.header ?? null,
              content: r.content ?? null,
              upvotes: r.upvotes ?? 0,
              downvotes: r.downvotes ?? 0,
              createdAt: r.createdAt,
            })
            setReviews((prev) => prev.filter((pr) => Number(pr.id) !== Number(r.id)))
            break outer
          }
        }
        if (page >= (body.pagination?.totalPages ?? 1)) break
        page++
      }
    } catch (e) { signOutIfAuthError(e) }
  }, [titleId])

  useEffect(() => {
    if (status === 'authenticated' && token) {
      let cancelled = false
      setLoadingMyContent(true)
      fetchMyContent(token).finally(() => {
        if (!cancelled) setLoadingMyContent(false)
      })
      return () => { cancelled = true }
    } else {
      setCurrentRating(null)
      setMyReview(null)
      setLoadingMyContent(false)
      setShowReviewForm(false)
      setEditingReview(false)
    }
  }, [status, token, fetchMyContent])

  async function handleRatingChange(star: number) {
    if (!token) return
    setRatingError(null)
    setRatingSubmitting(true)
    try {
      const { data } = await submitRating(titleId, star, mediaType, token)
      setCurrentRating(data.rating)
    } catch (e) {
      if (signOutIfAuthError(e)) return
      setRatingError(e instanceof Error ? e.message : 'Could not save rating.')
    } finally { setRatingSubmitting(false) }
  }

  async function handleRatingDelete() {
    if (!token) return
    setRatingError(null)
    setRatingSubmitting(true)
    try {
      await deleteRating(titleId, token)
      setCurrentRating(null)
    } catch (e) {
      if (signOutIfAuthError(e)) return
      setRatingError(e instanceof Error ? e.message : 'Could not remove rating.')
    } finally { setRatingSubmitting(false) }
  }

  async function handleReviewSubmit(header: string, content: string) {
    if (!token) return
    setReviewError(null)
    setReviewSubmitting(true)
    try {
      const created = await createReview(titleId, mediaType, content, header, token)
      setMyReview({
        id: created.id,
        title_id: created.title_id,
        header: created.header,
        content: created.content,
        upvotes: created.upvotes,
        downvotes: created.downvotes,
        createdAt: created.createdAt,
      })
      setReviews(prev => [{
        id: created.id,
        authorId: created.authorId,
        header: created.header,
        content: created.content,
        upvotes: created.upvotes,
        downvotes: created.downvotes,
        createdAt: created.createdAt,
        author: created.author ?? null,
      }, ...prev])
      setTotalReviews(n => n + 1)
      setShowReviewForm(false)
    } catch (e) {
      if (signOutIfAuthError(e)) return
      const msg = e instanceof Error ? e.message : 'Could not post review.'
      if (msg.includes('409')) {
        setShowReviewForm(false)
        setReviewError(null)
        if (token) await fetchMyContent(token)
      } else {
        setReviewError(msg)
      }
    } finally { setReviewSubmitting(false) }
  }

  async function handleReviewEdit(header: string, content: string) {
    if (!token || !myReview) return
    setReviewError(null)
    setReviewSubmitting(true)
    try {
      const updated = await updateReview(myReview.id, content, header, token)
      setMyReview({
        id: updated.id,
        title_id: updated.title_id,
        header: updated.header,
        content: updated.content,
        upvotes: updated.upvotes,
        downvotes: updated.downvotes,
        createdAt: updated.createdAt,
      })
      setReviews(prev => prev.map(r => r.id === updated.id ? { ...r, header: updated.header, content: updated.content } : r))
      setEditingReview(false)
    } catch (e) {
      if (signOutIfAuthError(e)) return
      setReviewError(e instanceof Error ? e.message : 'Could not update review.')
    } finally { setReviewSubmitting(false) }
  }

  async function handleReviewDelete() {
    if (!token || !myReview) return
    if (!confirm('Delete your review?')) return
    setReviewSubmitting(true)
    try {
      await deleteReview(myReview.id, token)
      setReviews(prev => prev.filter(r => r.id !== myReview.id))
      setTotalReviews(n => Math.max(0, n - 1))
      setMyReview(null)
    } catch (e) { signOutIfAuthError(e) } finally { setReviewSubmitting(false) }
  }

  if (status === 'loading') {
    return <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>Loading…</p>
  }

  return (
    <div>
      {/* ── Your Rating ── */}
      <section style={{
        marginBottom: '2.5rem',
        padding: '1.25rem 1.5rem',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
      }}>
        <h3 style={{ margin: '0 0 0.875rem', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Your Rating
        </h3>

        {status === 'unauthenticated' ? (
          <SignInButton callbackUrl={callbackUrl} className="btn-ghost" aria-label="Sign in to rate this title">
            Sign in to rate
          </SignInButton>
        ) : (
          <div>
            <StarRating value={currentRating} onChange={handleRatingChange} disabled={ratingSubmitting} />
            {currentRating !== null && (
              <button
                type="button"
                onClick={handleRatingDelete}
                disabled={ratingSubmitting}
                style={{ marginTop: '0.625rem', background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Remove rating
              </button>
            )}
            {ratingError && (
              <p role="alert" style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.375rem' }}>
                {ratingError}
              </p>
            )}
          </div>
        )}
      </section>

      {/* REVIEW SECTION */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Community Reviews{totalReviews > 0 ? ` (${totalReviews})` : ''}
          </h2>
          {status === 'authenticated' && !myReview && !showReviewForm && !loadingMyContent && (
            <button type="button" onClick={() => setShowReviewForm(true)} className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.875rem' }}>
              Write a Review
            </button>
          )}
          {status === 'unauthenticated' && (
            <SignInButton callbackUrl={callbackUrl}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.85rem' }}
              aria-label="Sign in to write a review">
              Sign in to review
            </SignInButton>
          )}
        </div>

        {/* New review form */}
        {status === 'authenticated' && !myReview && showReviewForm && !loadingMyContent && (
          <div style={{ ...cardStyle, marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700 }}>Write a Review</h3>
            <ReviewForm
              submitting={reviewSubmitting}
              error={reviewError}
              onSubmit={handleReviewSubmit}
              onCancel={() => { setShowReviewForm(false); setReviewError(null) }}
            />
          </div>
        )}

        {/* User's own review */}
        {myReview && (
          <div style={{ ...ownCardStyle, marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                Your review
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button"
                  onClick={() => { setEditingReview(true); setReviewError(null) }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                  Edit
                </button>
                <button type="button"
                  onClick={handleReviewDelete}
                  disabled={reviewSubmitting}
                  style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
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
                <p style={{ margin: '0 0 0.625rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{myReview.content}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', margin: 0 }}>
                  {new Date(myReview.createdAt).toLocaleDateString()}
                  {' · '}👍{myReview.upvotes} 👎{myReview.downvotes}
                </p>
              </>
            )}
          </div>
        )}

        {reviews.length === 0 && !myReview ? (
          <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
            No reviews yet — be the first!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {reviews
              .filter(r => r.id !== myReview?.id)
              .map(r => (
                <div key={r.id} style={cardStyle}>
                  {r.header && (
                    <p style={{ fontWeight: 700, margin: '0 0 0.5rem', fontSize: '0.975rem' }}>{r.header}</p>
                  )}
                  {r.content && (
                    <p style={{ margin: '0 0 0.75rem', lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {r.content}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', margin: 0 }}>
                      {r.author ? (r.author.display_name ?? r.author.username) : 'Anonymous'}
                      {' · '}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                    <ReviewVotes reviewId={r.id} upvotes={r.upvotes} downvotes={r.downvotes} />
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  )
}
