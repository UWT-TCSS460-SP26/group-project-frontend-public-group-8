'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { upvoteReview, removeUpvoteReview, downvoteReview, removeDownvoteReview } from '@/lib/api'
import { signOutIfAuthError } from '@/lib/clientAuth'

interface ReviewVotesProps {
  reviewId: number
  upvotes: number
  downvotes: number
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
        updated = kind === 'up'
          ? await removeUpvoteReview(reviewId, token)
          : await removeDownvoteReview(reviewId, token)
        setMyVote(null)
      } else {
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

  if (!showButtons) {
    return (
      <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
        👍 {counts.up} · 👎 {counts.down}
      </span>
    )
  }

  return (
    <span style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => vote('up')}
        disabled={pending}
        aria-label="Mark helpful"
        aria-pressed={myVote === 'up'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          padding: '0.2rem 0.6rem',
          border: `1px solid ${myVote === 'up' ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: '6px',
          background: myVote === 'up' ? 'rgba(0,229,255,0.12)' : 'transparent',
          color: myVote === 'up' ? 'var(--accent)' : 'var(--text-muted)',
          fontSize: '0.78rem',
          cursor: pending ? 'wait' : 'pointer',
          opacity: pending ? 0.6 : 1,
          transition: 'background 0.12s, border-color 0.12s, color 0.12s',
          fontFamily: 'inherit',
        }}
      >
        👍 <span style={{ fontWeight: 600 }}>{counts.up}</span>
      </button>
      <button
        type="button"
        onClick={() => vote('down')}
        disabled={pending}
        aria-label="Mark not helpful"
        aria-pressed={myVote === 'down'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          padding: '0.2rem 0.6rem',
          border: `1px solid ${myVote === 'down' ? 'var(--error)' : 'var(--border)'}`,
          borderRadius: '6px',
          background: myVote === 'down' ? 'rgba(248,113,113,0.1)' : 'transparent',
          color: myVote === 'down' ? 'var(--error)' : 'var(--text-muted)',
          fontSize: '0.78rem',
          cursor: pending ? 'wait' : 'pointer',
          opacity: pending ? 0.6 : 1,
          transition: 'background 0.12s, border-color 0.12s, color 0.12s',
          fontFamily: 'inherit',
        }}
      >
        👎 <span style={{ fontWeight: 600 }}>{counts.down}</span>
      </button>
    </span>
  )
}
