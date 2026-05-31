'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

function NavSearchInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [type, setType] = useState(searchParams.get('type') ?? 'all')

  // Keep fields in sync when the URL changes (e.g. browser back/forward)
  useEffect(() => {
    setQ(searchParams.get('q') ?? '')
    setType(searchParams.get('type') ?? 'all')
  }, [searchParams])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = q.trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}&type=${type}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, minWidth: '220px', maxWidth: '560px' }}
    >
      <div style={{ display: 'flex', flex: 1, border: '2px solid var(--accent)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg)' }}>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search movies & shows…"
          aria-label="Search movies and TV shows"
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            border: 'none',
            outline: 'none',
            fontSize: '0.95rem',
            background: 'transparent',
            color: 'var(--text)',
            minWidth: 0,
          }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Media type filter"
          style={{
            padding: '0.5rem 0.5rem',
            border: 'none',
            borderLeft: '1px solid var(--border)',
            outline: 'none',
            fontSize: '0.875rem',
            background: 'var(--bg-subtle)',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          <option value="all">All</option>
          <option value="movie">Movies</option>
          <option value="tv">TV</option>
        </select>
      </div>
      <button
        type="submit"
        aria-label="Submit search"
        style={{
          padding: '0.5rem 1rem',
          background: 'var(--accent)',
          color: 'var(--accent-text)',
          border: 'none',
          borderRadius: '8px',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Search
      </button>
    </form>
  )
}

export default function NavSearch() {
  return (
    <Suspense>
      <NavSearchInner />
    </Suspense>
  )
}
