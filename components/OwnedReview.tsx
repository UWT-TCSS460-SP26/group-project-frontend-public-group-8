'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateReview, deleteReview } from '@/lib/actions'
import type { UserReview } from '@/lib/api'

const HEADER_MAX = 200
const CONTENT_MAX = 5000

export default function OwnedReview({ review }: { review: UserReview }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [header, setHeader] = useState(review.header ?? '')
  const [content, setContent] = useState(review.content ?? '')
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function save() {
    setErr(null)
    if (!content.trim()) {
      setErr('Review content cannot be empty.')
      return
    }
    startTransition(async () => {
      const res = await updateReview(review.id, { content, header })
      if (res.ok) {
        setEditing(false)
        router.refresh()
      } else {
        setErr(res.error)
      }
    })
  }

  function remove() {
    if (!confirm('Delete this review? This cannot be undone.')) return
    setErr(null)
    startTransition(async () => {
      const res = await deleteReview(review.id)
      if (res.ok) router.refresh()
      else setErr(res.error)
    })
  }

  const m = review.metadata
  const mediaType = review.media_type ?? 'movie'
  const detailHref = m ? `/media/${mediaType}/${review.title_id}` : null

  return (
    <article
      style={{
        border: '1px solid var(--border)',
        background: 'var(--card-bg)',
        borderRadius: '8px',
        padding: '1rem 1.25rem',
      }}
    >
      {m && detailHref && (
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--text-faint)' }}>
          <a href={detailHref} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            {m.title} {m.year ? `(${m.year})` : ''}
          </a>
          {' · '}
          {mediaType === 'tv' ? 'TV' : 'Movie'}
        </p>
      )}

      {editing ? (
        <>
          <label htmlFor={`edit-h-${review.id}`} style={labelStyle}>
            Title
          </label>
          <input
            id={`edit-h-${review.id}`}
            value={header}
            onChange={(e) => setHeader(e.target.value)}
            maxLength={HEADER_MAX}
            style={{ ...inputStyle, marginBottom: '0.625rem' }}
          />
          <label htmlFor={`edit-c-${review.id}`} style={labelStyle}>
            Review
          </label>
          <textarea
            id={`edit-c-${review.id}`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={CONTENT_MAX}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', marginBottom: '0.625rem' }}
          />
          {err && <p role="alert" style={errStyle}>{err}</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={save} disabled={pending} style={primaryBtn(pending)}>
              {pending ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setHeader(review.header ?? '')
                setContent(review.content ?? '')
                setErr(null)
              }}
              disabled={pending}
              style={secondaryBtn(pending)}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          {review.header && (
            <p style={{ fontWeight: 700, margin: '0 0 0.5rem' }}>{review.header}</p>
          )}
          {review.content && (
            <p style={{ margin: '0 0 0.75rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              {review.content}
            </p>
          )}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', margin: '0 0 0.625rem' }}>
            {new Date(review.createdAt).toLocaleDateString()} · ↑{review.upvotes} ↓{review.downvotes}
          </p>
          {err && <p role="alert" style={errStyle}>{err}</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={() => setEditing(true)} style={secondaryBtn(false)}>
              Edit
            </button>
            <button type="button" onClick={remove} disabled={pending} style={dangerBtn(pending)}>
              {pending ? 'Working…' : 'Delete'}
            </button>
          </div>
        </>
      )}
    </article>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  fontSize: '0.8rem',
  marginBottom: '0.25rem',
}
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  borderRadius: '6px',
  padding: '0.5rem 0.625rem',
  color: 'var(--input-text)',
  font: 'inherit',
  fontSize: '0.9rem',
}
const errStyle: React.CSSProperties = {
  margin: '0 0 0.5rem',
  fontSize: '0.8rem',
  color: 'var(--error)',
}
function primaryBtn(pending: boolean): React.CSSProperties {
  return {
    background: 'var(--accent)',
    color: 'var(--accent-text)',
    border: 'none',
    borderRadius: '6px',
    padding: '0.375rem 0.875rem',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: pending ? 'wait' : 'pointer',
  }
}
function secondaryBtn(pending: boolean): React.CSSProperties {
  return {
    background: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '0.375rem 0.875rem',
    fontSize: '0.85rem',
    cursor: pending ? 'wait' : 'pointer',
  }
}
function dangerBtn(pending: boolean): React.CSSProperties {
  return {
    background: 'transparent',
    color: 'var(--error)',
    border: '1px solid var(--error)',
    borderRadius: '6px',
    padding: '0.375rem 0.875rem',
    fontSize: '0.85rem',
    cursor: pending ? 'wait' : 'pointer',
  }
}
