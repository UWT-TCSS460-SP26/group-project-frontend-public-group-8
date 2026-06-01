'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitRating, deleteRating } from '@/lib/actions'

interface Props {
  titleId: number
  mediaType: 'movie' | 'tv'
  initialRating?: number | null
}

export default function RateControl({ titleId, mediaType, initialRating }: Props) {
  const router = useRouter()
  const [rating, setRating] = useState<number | null>(initialRating ?? null)
  const [hover, setHover] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const display = hover ?? rating ?? 0

  function pick(value: number) {
    setError(null)
    const previous = rating
    setRating(value)
    startTransition(async () => {
      const res = await submitRating(titleId, mediaType, value)
      if (!res.ok) {
        setRating(previous)
        setError(res.error)
      } else {
        router.refresh()
      }
    })
  }

  function clear() {
    if (rating == null) return
    setError(null)
    const previous = rating
    setRating(null)
    startTransition(async () => {
      const res = await deleteRating(titleId, mediaType)
      if (!res.ok) {
        setRating(previous)
        setError(res.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '0.875rem 1rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
      }}
    >
      <p
        id={`rate-label-${titleId}`}
        style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}
      >
        Your rating
      </p>
      <div
        role="radiogroup"
        aria-labelledby={`rate-label-${titleId}`}
        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= display
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              disabled={pending}
              onClick={() => pick(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(null)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.125rem 0.25rem',
                cursor: pending ? 'wait' : 'pointer',
                fontSize: '1.5rem',
                lineHeight: 1,
                color: active ? 'var(--accent)' : 'var(--text-faint)',
                transition: 'color 0.12s ease',
              }}
            >
              {active ? '★' : '☆'}
            </button>
          )
        })}
        {rating != null && (
          <button
            type="button"
            onClick={clear}
            disabled={pending}
            style={{
              marginLeft: '0.75rem',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '0.25rem 0.625rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              cursor: pending ? 'wait' : 'pointer',
            }}
          >
            Clear
          </button>
        )}
        <span
          aria-live="polite"
          style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}
        >
          {pending ? 'Saving…' : rating != null ? `You rated ${rating}/5` : 'Click a star to rate'}
        </span>
      </div>
      {error && (
        <p role="alert" style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--error)' }}>
          {error}
        </p>
      )}
    </div>
  )
}