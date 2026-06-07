'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import EightBall from './EightBall'

export default function EightBallLauncher() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Escape to close; lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  // Restore focus to the trigger when closing.
  useEffect(() => {
    if (!open) triggerRef.current?.focus()
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open the Magic 8-Ball recommender"
        aria-haspopup="dialog"
        title="Magic 8-Ball — pick something to watch"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          cursor: 'pointer',
          flexShrink: 0,
          fontSize: '1.05rem',
          background: 'radial-gradient(circle at 35% 30%, #243240 0%, #0a0e14 60%, #000 100%)',
          border: '1px solid rgba(0,212,255,0.45)',
          color: '#7ff0ff',
          boxShadow: '0 0 10px rgba(0,212,255,0.35)',
          textShadow: '0 0 8px rgba(0,212,255,0.9)',
          fontWeight: 800,
        }}
      >
        8
      </button>

      {mounted && open && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Magic 8-Ball recommender"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2,8,16,0.88)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />

          {/* Panel — fixed size, centered; body scrolls internally so the
              window never resizes when a result appears. */}
          <div
            ref={panelRef}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              width: 'min(540px, 100%)',
              height: 'min(620px, calc(100dvh - 2rem))',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              boxShadow: '0 0 0 1px rgba(0,212,255,0.18), 0 24px 64px rgba(0,0,0,0.85)',
              overflow: 'hidden',
            }}
          >
            {/* Cyan accent line */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: '12%',
                right: '12%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, var(--accent), var(--violet), transparent)',
                borderRadius: '2px',
                zIndex: 1,
              }}
            />

            {/* Header row (fixed) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.5rem 1.75rem 0.75rem',
                flexShrink: 0,
              }}
            >
              <h2 className="section-heading" style={{ margin: 0 }}>
                Ask the 8-Ball
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                title="Close"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1.5px solid var(--accent)',
                  background: 'transparent',
                  color: 'var(--accent)',
                  fontSize: '1.1rem',
                  lineHeight: 1,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--accent-text)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--accent)'
                }}
              >
                ✕
              </button>
            </div>

            {/* Scrollable body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0.5rem 1.75rem 1.75rem',
              }}
            >
              <EightBall />

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-ghost"
                style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}