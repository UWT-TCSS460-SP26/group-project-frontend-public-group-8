'use client'

import { useMedia } from '@/lib/MediaContext'
import { usePathname } from 'next/navigation'

export default function MasterMediaToggle() {
  const { mediaType, setMediaType, isInitialized } = useMedia()
  const pathname = usePathname()

  if (pathname !== '/') {
    return null
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '2px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    gap: '2px',
    minWidth: '120px', // Prevent layout shift
    height: '32px',
    boxSizing: 'border-box',
  }

  if (!isInitialized) {
    return <div style={containerStyle} />
  }

  const baseBtnStyle: React.CSSProperties = {
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    border: 'none',
    fontSize: '0.75rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const activeStyle: React.CSSProperties = {
    ...baseBtnStyle,
    background: 'var(--accent)',
    color: 'var(--accent-text)',
    boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
  }

  const inactiveStyle: React.CSSProperties = {
    ...baseBtnStyle,
    background: 'transparent',
    color: 'var(--text-muted)',
  }

  return (
    <div style={containerStyle}>
      <button
        onClick={() => setMediaType('movie')}
        style={mediaType === 'movie' ? activeStyle : inactiveStyle}
        aria-pressed={mediaType === 'movie'}
      >
        Movies
      </button>
      <button
        onClick={() => setMediaType('tv')}
        style={mediaType === 'tv' ? activeStyle : inactiveStyle}
        aria-pressed={mediaType === 'tv'}
      >
        TV
      </button>
    </div>
  )
}
