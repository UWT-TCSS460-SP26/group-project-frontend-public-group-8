'use client'

import { useState, useEffect } from 'react'

type Mode = 'standard' | 'compact'

const LS_KEY = 'carousel-compact'

export default function CompactToggle() {
  const [mode, setMode]       = useState<Mode>('standard')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (localStorage.getItem(LS_KEY) === 'true') setMode('compact')
  }, [])

  useEffect(() => {
    if (!mounted) return
    const compact = mode === 'compact'
    if (compact) {
      document.documentElement.dataset.carouselCompact = 'true'
    } else {
      delete document.documentElement.dataset.carouselCompact
    }
    localStorage.setItem(LS_KEY, String(compact))
  }, [mode, mounted])

  // Render a server-safe placeholder that matches the hydrated size to avoid
  // layout shift; actual interactive buttons swap in after hydration
  if (!mounted) {
    return <div style={{ height: '28px' }} />
  }

  const base: React.CSSProperties = {
    display:        'inline-flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '4px 14px',
    borderWidth:    '1px',
    borderStyle:    'solid',
    borderColor:    'var(--border)',
    borderRadius:   '4px',
    fontSize:       '0.70rem',
    fontWeight:     700,
    letterSpacing:  '0.07em',
    textTransform:  'uppercase',
    cursor:         'pointer',
    transition:     'background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s',
    fontFamily:     'var(--font-orbitron, "Orbitron", monospace)',
    lineHeight:     1,
  }

  const active: React.CSSProperties = {
    background:  'var(--accent)',
    borderColor: 'var(--accent)',
    color:       'var(--accent-text)',
    boxShadow:   'var(--accent-glow)',
  }

  const inactive: React.CSSProperties = {
    background:  'transparent',
    color:       'var(--text-muted)',
  }

  return (
    <div
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '0.375rem',
      }}
      role="group"
      aria-label="Card display mode"
    >
      <button
        type="button"
        aria-pressed={mode === 'standard'}
        onClick={() => setMode('standard')}
        style={{ ...base, ...(mode === 'standard' ? active : inactive) }}
      >
        Standard
      </button>
      <button
        type="button"
        aria-pressed={mode === 'compact'}
        onClick={() => setMode('compact')}
        style={{ ...base, ...(mode === 'compact' ? active : inactive) }}
      >
        Compact
      </button>
    </div>
  )
}
