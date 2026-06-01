'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitRating, deleteRating } from '@/lib/actions'
import type { UserRating } from '@/lib/api'

export default function OwnedRating({ rating }: { rating: UserRating }) {
  const router = useRouter()
  const [current, setCurrent] = useState<number>(rating.rating)
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const mediaType: 'movie' | 'tv' = rating.media_type ?? 'movie'
  const m = rating.metadata

  function update(value: number) {
    if (value === current) return
    setErr(null)
    const prev = current
    setCurrent(value)
    startTransition(async () => {
      const res = await submitRating(rating.title_id, mediaType, value)
      if (!res.ok) {
        setCurrent(prev)
        setErr(res.error)
      } else router.refresh()
    })
  }

  function remove() {
    if (!confirm('Delete this rating?')) return
    setErr(null)
    startTransition(async () => {
      const res = await deleteRating(rating.title_id, mediaType)
      if (res.ok) router.refresh()
      else setErr(res.error)
    })
  }

  return (
    <article
      style={{
        border: '1px solid var(--border)',
        background: 'var(--card-bg)',
        borderRadius: '8px',
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: '200px' }}>
        {m ? (
          <a
            href={`/media/${mediaType}/${rating.title_id}`}
            style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600 }}
          >
            {m.title} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
              {m.year ? `(${m.year})` : ''}
            </span>
          </a>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Title #{rating.title_id}</span>
        )}
        <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'var(--text-faint)' }}>
          {mediaType === 'tv' ? 'TV' : 'Movie'}
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label={`Rating for ${m?.title ?? `title ${rating.title_id}`}`}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={current === n}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            disabled={pending}
            onClick={() => update(n)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0.125rem 0.125rem',
              fontSize: '1.25rem',
              color: n <= current ? 'var(--accent)' : 'var(--text-faint)',
              cursor: pending ? 'wait' : 'pointer',
              lineHeight: 1,
            }}
          >
            {n <= current ? '★' : '☆'}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={remove}
        disabled={pending}
        style={{
          background: 'transparent',
          color: 'var(--error)',
          border: '1px solid var(--error)',
          borderRadius: '6px',
          padding: '0.25rem 0.625rem',
          fontSize: '0.75rem',
          cursor: pending ? 'wait' : 'pointer',
        }}
      >
        Delete
      </button>

      {err && (
        <p role="alert" style={{ width: '100%', margin: 0, fontSize: '0.8rem', color: 'var(--error)' }}>
          {err}
        </p>
      )}
    </article>
  )
}