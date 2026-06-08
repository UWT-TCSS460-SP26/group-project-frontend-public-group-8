'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'

function NavSearchInner() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  // Initialize from URL; do not sync on every searchParams change —
  // the search page manages its own input state, and syncing here was
  // the source of repeated re-renders in NavSearch.
  const [q,    setQ]    = useState(searchParams?.get('q')    ?? '')
  const [type, setType] = useState(searchParams?.get('type') ?? 'all')

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    const trimmed = q.trim()
    if (!trimmed) return
    const p = new URLSearchParams()
    p.set('q', trimmed)
    if (type !== 'all') p.set('type', type)
    router.push(`/search?${p.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flex: 1, minWidth: '160px', maxWidth: '560px' }}
    >
      <input
        type="search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search movies & shows…"
        aria-label="Search movies and TV shows"
        style={{
          flex:         1,
          padding:      '0.35rem 0.625rem',
          borderWidth:  '1px',
          borderStyle:  'solid',
          borderColor:  'var(--input-border)',
          borderRadius: '6px',
          fontSize:     '0.85rem',
          background:   'var(--bg-subtle)',
          color:        'var(--text)',
          minWidth:     0,
          height:       '32px',
          boxSizing:    'border-box',
          transition:   'border-color 0.15s, box-shadow 0.15s',
          outline:      'none',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.boxShadow   = '0 0 0 2px var(--accent-ring)'
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'var(--input-border)'
          e.currentTarget.style.boxShadow   = 'none'
        }}
      />
      <select
        value={type}
        onChange={e => setType(e.target.value)}
        aria-label="Media type filter"
        style={{
          padding:      '0.35rem 0.5rem',
          borderWidth:  '1px',
          borderStyle:  'solid',
          borderColor:  'var(--input-border)',
          borderRadius: '6px',
          fontSize:     '0.8rem',
          background:   'var(--bg-subtle)',
          color:        'var(--text)',
          flexShrink:   0,
          height:       '32px',
          boxSizing:    'border-box',
          cursor:       'pointer',
        }}
      >
        <option value="all">All</option>
        <option value="movie">Movies</option>
        <option value="tv">TV</option>
      </select>
      <button
        type="submit"
        aria-label="Submit search"
        className="btn-primary"
        style={{ height: '32px', padding: '0 0.75rem', fontSize: '0.8rem', flexShrink: 0 }}
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
