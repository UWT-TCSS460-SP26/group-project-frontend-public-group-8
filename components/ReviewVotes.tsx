'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { upvoteReview, downvoteReview } from '@/lib/api'
import { signOutIfAuthError } from '@/lib/clientAuth'

interface ReviewVotesProps {
  reviewId: number
  upvotes: number
  downvotes: number
  /** Hide the buttons (e.g. for the user's own review). Counts still show. */
  readOnly?: boolean
}

export default function ReviewVotes({ reviewId, upvotes, downvotes, readOnly = false }: ReviewVotesProps) {
  const { data: session } = useSession()
  const token = session?.accessToken

  const [counts, setCounts] = useState({ up: upvotes, down: downvotes })
  const [pending, setPending] = useState(false)

  async function vote(kind: 'up' | 'down') {
    if (!token || pending) return
    setPending(true)
    try {
      const updated = kind === 'up'
        ? await upvoteReview(reviewId, token)
        : await downvoteReview(reviewId, token)
      setCounts({ up: updated.upvotes, down: updated.downvotes })
    } catch (e) {
      signOutIfAuthError(e)
    } finally {
      setPending(false)
    }
  }

  const showButtons = !!token && !readOnly

  const btnStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '0.15rem 0.5rem',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    cursor: pending ? 'wait' : 'pointer',
    opacity: pending ? 0.6 : 1,
    fontFamily: 'inherit',
  }

  if (!showButtons) {
    return (
      <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
        ↑{counts.up} ↓{counts.down}
      </span>
    )
  }

  return (
    <span style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => vote('up')}
        disabled={pending}
        style={btnStyle}
        aria-label="Mark this review as helpful"
      >
        👍 {counts.up}
      </button>
      <button
        type="button"
        onClick={() => vote('down')}
        disabled={pending}
        style={btnStyle}
        aria-label="Mark this review as not helpful"
      >
        👎 {counts.down}
      </button>
    </span>
  )
}
