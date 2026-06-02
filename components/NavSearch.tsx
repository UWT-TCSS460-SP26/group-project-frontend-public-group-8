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

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    const trimmed = q.trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}&type=${type}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flex: 1, minWidth: '200px', maxWidth: '700px', margin: '0 auto' }}
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search movies &amp; shows…"
        aria-label="Search movies and TV shows"
        style={{
          flex: 1,
          padding: '0.375rem 0.625rem',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          fontSize: '0.875rem',
          background: 'var(--bg-subtle)',
          color: 'var(--text)',
          minWidth: 0,
          height: '32px',
          boxSizing: 'border-box' as const,
        }}
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        aria-label="Media type filter"
        style={{
          padding: '0.375rem 0.625rem',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          fontSize: '0.875rem',
          background: 'var(--bg-subtle)',
          color: 'var(--text)',
          flexShrink: 0,
          height: '32px',
          boxSizing: 'border-box' as const,
        }}
      >
        <option value="all">All</option>
        <option value="movie">Movies</option>
        <option value="tv">TV</option>
      </select>
      <button
        type="submit"
        aria-label="Submit search"
        style={{
          padding: '0.375rem 0.75rem',
          background: 'var(--accent)',
          color: 'var(--accent-text)',
          border: 'none',
          borderRadius: '6px',
          fontSize: '0.875rem',
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
