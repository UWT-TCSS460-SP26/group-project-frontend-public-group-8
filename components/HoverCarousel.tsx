'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

interface Props {
  children: React.ReactNode
  onScrollEnd?: () => void
}

const SCROLL_STEP = 320
const HOVER_EDGE = 80
const HOVER_SPEED = 2

export default function HoverCarousel({ children, onScrollEnd }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const isAtEnd = useRef(false)
  const dirRef = useRef(0)
  const rafRef = useRef(0)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  const updateArrows = useCallback(() => {
    const el = ref.current
    if (!el) return
    setShowLeft(el.scrollLeft > 4)
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  // Sync arrows on scroll + resize
  useEffect(() => {
    const el = ref.current
    if (!el) return
    updateArrows()
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)
    el.addEventListener('scroll', updateArrows, { passive: true })
    return () => { ro.disconnect(); el.removeEventListener('scroll', updateArrows) }
  }, [updateArrows])

  // Scroll-end callback
  useEffect(() => {
    const el = ref.current
    if (!el || !onScrollEnd) return
    const check = () => {
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1
      if (atEnd && !isAtEnd.current) { isAtEnd.current = true; onScrollEnd() }
      else if (!atEnd) isAtEnd.current = false
    }
    el.addEventListener('scroll', check, { passive: true })
    return () => el.removeEventListener('scroll', check)
  }, [onScrollEnd])

  // Mouse-proximity auto-scroll (desktop hover UX)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const loop = () => {
      if (dirRef.current !== 0) el.scrollLeft += dirRef.current * HOVER_SPEED
      rafRef.current = requestAnimationFrame(loop)
    }
    const onMove = (e: MouseEvent) => {
      const { left, width } = el.getBoundingClientRect()
      const x = e.clientX - left
      dirRef.current = x < HOVER_EDGE ? -1 : x > width - HOVER_EDGE ? 1 : 0
    }
    const onLeave = () => { dirRef.current = 0 }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  function scrollDir(dir: number) {
    ref.current?.scrollBy({ left: dir * SCROLL_STEP, behavior: 'smooth' })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) return
    if (e.key === 'ArrowLeft') { e.preventDefault(); scrollDir(-1) }
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollDir(1) }
  }

  const arrowBtn: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    bottom: '1rem',
    width: '44px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    zIndex: 10,
    background: 'none',
    border: 'none',
    padding: 0,
  }

  return (
    <div style={{ position: 'relative' }}>
      {showLeft && (
        <button
          type="button"
          aria-label="Scroll left"
          tabIndex={-1}
          onClick={() => scrollDir(-1)}
          style={{
            ...arrowBtn,
            left: 0,
            justifyContent: 'flex-start',
            paddingLeft: '4px',
            background: 'linear-gradient(to right, var(--carousel-fade) 0%, transparent 100%)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
            style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,255,0.8)) drop-shadow(0 0 16px rgba(0,255,255,0.4))', opacity: 0.95 }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {showRight && (
        <button
          type="button"
          aria-label="Scroll right"
          tabIndex={-1}
          onClick={() => scrollDir(1)}
          style={{
            ...arrowBtn,
            right: 0,
            justifyContent: 'flex-end',
            paddingRight: '4px',
            background: 'linear-gradient(to left, var(--carousel-fade) 0%, transparent 100%)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
            style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,255,0.8)) drop-shadow(0 0 16px rgba(0,255,255,0.4))', opacity: 0.95 }}
          >
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      )}

      <div
        ref={ref}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="carousel-scroll"
      >
        {children}
      </div>
    </div>
  )
}
