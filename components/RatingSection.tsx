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
      if (signOutIfAuthError(e)) return
      setRatingError(e instanceof Error ? e.message : 'Could not remove rating.')
    } finally {
      setRatingSubmitting(false)
    }
  }

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
      if (signOutIfAuthError(e)) return
      const msg = e instanceof Error ? e.message : 'Could not post review.'
      if (msg.includes('409')) {
        setShowReviewForm(false)
        setReviewError(null)
        if (token) await fetchMyContent(token)
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
      if (signOutIfAuthError(e)) return
      setReviewError(e instanceof Error ? e.message : 'Could not update review.')
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
    } catch (e) {
      signOutIfAuthError(e)
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (status === 'loading') {
    return <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>Loading…</p>
  }

  return (
    <div>
      {/* RATING SECTION */}
      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Your Rating</h3>
        {status === 'unauthenticated' ? (
          <div style={{
            padding: '1.5rem',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
            textAlign: 'center',
            background: 'var(--bg-subtle)'
          }}>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 1rem' }}>
              Sign in to rate this title.
            </p>
            <SignInButton
              callbackUrl={callbackUrl}
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
            </SignInButton>
          </div>
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

      {/* REVIEW SECTION */}
      <section>
        <h2 style={{ marginBottom: '1rem' }}>
          Community Reviews{totalReviews > 0 ? ` (${totalReviews})` : ''}
        </h2>

        {status === 'authenticated' && !myReview && !showReviewForm && !loadingMyContent && (
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

        {status === 'authenticated' && !myReview && showReviewForm && !loadingMyContent && (
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

        {status === 'unauthenticated' && (
          <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <SignInButton
              callbackUrl={callbackUrl}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
            >
              Sign in
            </SignInButton>{' '}
            to write a review.
          </p>
        )}

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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', margin: 0 }}>
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
