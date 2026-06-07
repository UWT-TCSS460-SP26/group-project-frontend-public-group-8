'use client'

import { useRef, useEffect, useCallback } from 'react'

interface Props {
  children: React.ReactNode
  onScrollEnd?: () => void
}

// Cards scroll by one "page" worth of visible cards
const SCROLL_STEP = 320

export default function HoverCarousel({ children, onScrollEnd }: Props) {
  const ref        = useRef<HTMLDivElement>(null)
  const isAtEnd    = useRef(false)
  const rafRef     = useRef(0)
  const leftBtnRef  = useRef<HTMLButtonElement>(null)
  const rightBtnRef = useRef<HTMLButtonElement>(null)

  // Single rAF pass: update arrow opacity + active-card class
  const sync = useCallback(() => {
    const el = ref.current
    if (!el) return

    const atLeft  = el.scrollLeft <= 2
    const atRight = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2

    const lb = leftBtnRef.current
    const rb = rightBtnRef.current
    if (lb) {
      lb.style.opacity      = atLeft  ? '0' : '1'
      lb.style.pointerEvents = atLeft  ? 'none' : 'auto'
    }
    if (rb) {
      rb.style.opacity      = atRight ? '0' : '1'
      rb.style.pointerEvents = atRight ? 'none' : 'auto'
    }

    // Identify the .media-card child closest to the carousel center
    const cards = Array.from(el.children).filter(
      c => (c as HTMLElement).classList.contains('media-card')
    ) as HTMLElement[]

    if (cards.length === 0) return

    const center = el.scrollLeft + el.clientWidth / 2
    let closestIdx = 0
    let minDist    = Infinity
    cards.forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center)
      if (dist < minDist) { minDist = dist; closestIdx = i }
    })
    cards.forEach((card, i) => {
      const should = i === closestIdx
      if (card.classList.contains('carousel-card-active') !== should) {
        card.classList.toggle('carousel-card-active', should)
      }
    })
  }, [])

  const scheduleSync = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(sync)
  }, [sync])

  // Attach scroll + resize listeners
  useEffect(() => {
    const el = ref.current
    if (!el) return
    scheduleSync()
    const ro = new ResizeObserver(scheduleSync)
    ro.observe(el)
    el.addEventListener('scroll', scheduleSync, { passive: true })
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', scheduleSync)
      cancelAnimationFrame(rafRef.current)
    }
  }, [scheduleSync])

  // Infinite-load callback — fires when user scrolls to the end
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

  function scrollDir(dir: number) {
    ref.current?.scrollBy({ left: dir * SCROLL_STEP, behavior: 'smooth' })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const t = e.target as HTMLElement
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) return
    if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollDir(-1) }
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollDir(1) }
  }

  /*
    Arrow button base style.
    Width: 80px — wide enough to be an obvious, easy-to-hit target.
    top/bottom: 0 — covers the full carousel height (including padding).
    z-index: 10 — above card z-index (3–6) so the gradient overlay renders
    on top; arrows remain clickable even when a card is scaled near the edge.
  */
  const arrowBase: React.CSSProperties = {
    position:      'absolute',
    top:           0,
    bottom:        0,
    width:         '80px',
    display:       'flex',
    alignItems:    'center',
    cursor:        'pointer',
    zIndex:        10,
    background:    'none',
    border:        'none',
    padding:       0,
    transition:    'opacity 0.2s ease',
    /*
      touchAction: 'pan-x' on the arrow buttons is critical for mobile.
      The buttons are 80px wide and sit on top of the carousel scroll container
      with pointer-events: auto, so touches starting in those zones land on
      the button element, not on the carousel-scroll div. Without pan-x on the
      button itself, the browser cannot tell that a horizontal swipe starting
      here should scroll the carousel — it falls back to scrolling the page.
      With pan-x, taps still fire onClick; swipes pass through as scroll gestures.
    */
    touchAction:   'pan-x',
  }

  return (
    /*
      overflow: visible on the wrapper is critical.
      Scaled cards must be able to visually escape the wrapper boundary
      (they are clipped only by overflow:auto on .carousel-scroll in the Y axis —
      which is why .carousel-scroll has generous top/bottom padding).
    */
    <div style={{ position: 'relative', overflow: 'visible' }}>

      {/* ── Left arrow ── */}
      <button
        ref={leftBtnRef}
        type="button"
        aria-label="Scroll left"
        tabIndex={-1}
        onClick={() => scrollDir(-1)}
        style={{
          ...arrowBase,
          left:            0,
          justifyContent: 'flex-start',
          paddingLeft:    '10px',
          background:     'linear-gradient(to right, var(--carousel-fade) 0%, var(--carousel-mid) 45%, transparent 100%)',
          opacity:        0,
          pointerEvents:  'none',
        }}
      >
        <svg
          width="30" height="30" viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{
            filter:     'drop-shadow(0 0 8px rgba(0,212,255,0.90)) drop-shadow(0 0 18px rgba(0,212,255,0.50))',
            transition: 'transform 0.18s ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => ((e.currentTarget as SVGElement).style.transform = 'scale(1.20)')}
          onMouseLeave={e => ((e.currentTarget as SVGElement).style.transform = 'scale(1)')}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* ── Right arrow ── */}
      <button
        ref={rightBtnRef}
        type="button"
        aria-label="Scroll right"
        tabIndex={-1}
        onClick={() => scrollDir(1)}
        style={{
          ...arrowBase,
          right:           0,
          justifyContent: 'flex-end',
          paddingRight:   '10px',
          background:     'linear-gradient(to left, var(--carousel-fade) 0%, var(--carousel-mid) 45%, transparent 100%)',
          opacity:        0,
          pointerEvents:  'none',
        }}
      >
        <svg
          width="30" height="30" viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{
            filter:     'drop-shadow(0 0 8px rgba(0,212,255,0.90)) drop-shadow(0 0 18px rgba(0,212,255,0.50))',
            transition: 'transform 0.18s ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => ((e.currentTarget as SVGElement).style.transform = 'scale(1.20)')}
          onMouseLeave={e => ((e.currentTarget as SVGElement).style.transform = 'scale(1)')}
        >
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </button>

      {/* ── Scroll container ── */}
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
