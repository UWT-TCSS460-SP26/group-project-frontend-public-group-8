'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { upvoteReview, removeUpvoteReview, downvoteReview, removeDownvoteReview } from '@/lib/api'
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
  const [myVote, setMyVote] = useState<'up' | 'down' | null>(null)
  const [pending, setPending] = useState(false)

  async function vote(kind: 'up' | 'down') {
    if (!token || pending) return
    setPending(true)
    try {
      let updated
      if (myVote === kind) {
        // Toggle off — remove the existing vote
        updated = kind === 'up'
          ? await removeUpvoteReview(reviewId, token)
          : await removeDownvoteReview(reviewId, token)
        setMyVote(null)
      } else {
        // Switch sides — remove old vote first (if any), then cast new one
        if (myVote === 'up') await removeUpvoteReview(reviewId, token)
        if (myVote === 'down') await removeDownvoteReview(reviewId, token)
        updated = kind === 'up'
          ? await upvoteReview(reviewId, token)
          : await downvoteReview(reviewId, token)
        setMyVote(kind)
      }
      setCounts({ up: updated.upvotes, down: updated.downvotes })
    } catch (e) {
      signOutIfAuthError(e)
    } finally {
      setPending(false)
    }
  }

  const showButtons = !!token && !readOnly

  function btnStyle(active: boolean): React.CSSProperties {
    return {
      background: active ? 'var(--accent)' : 'none',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      padding: '0.15rem 0.5rem',
      fontSize: '0.8rem',
      color: active ? 'var(--accent-text)' : 'var(--text-muted)',
      cursor: pending ? 'wait' : 'pointer',
      opacity: pending ? 0.6 : 1,
      fontFamily: 'inherit',
    }
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
        style={btnStyle(myVote === 'up')}
        aria-label="Mark helpful"
        aria-pressed={myVote === 'up'}
      >
        👍 {counts.up}
      </button>
      <button
        type="button"
        onClick={() => vote('down')}
        disabled={pending}
        style={btnStyle(myVote === 'down')}
        aria-label="Mark not helpful"
        aria-pressed={myVote === 'down'}
      >
        👎 {counts.down}
      </button>
    </span>
  )
}
