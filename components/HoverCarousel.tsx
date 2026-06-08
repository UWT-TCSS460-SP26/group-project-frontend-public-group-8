'use client'

import { useRef, useEffect, useCallback } from 'react'

interface Props {
  children: React.ReactNode
  onScrollEnd?: () => void
  onActiveIndexChange?: (index: number) => void
  hoverIndex?: number | null
}

const SCROLL_STEP    = 320
const SNAP_SETTLE_MS = 120   // ms of scroll silence before snap fires
const DRAG_THRESHOLD = 5     // px horizontal movement before treating as drag vs click

export default function HoverCarousel({ children, onScrollEnd, onActiveIndexChange, hoverIndex }: Props) {
  const ref         = useRef<HTMLDivElement>(null)
  const isAtEnd     = useRef(false)
  const rafRef      = useRef(0)
  const leftBtnRef  = useRef<HTMLButtonElement>(null)
  const rightBtnRef = useRef<HTMLButtonElement>(null)

  // Keep stable refs so sync() never captures stale callbacks or values
  const onActiveIndexChangeRef = useRef(onActiveIndexChange)
  useEffect(() => { onActiveIndexChangeRef.current = onActiveIndexChange }, [onActiveIndexChange])
  const lastActiveIdx  = useRef(-1)
  const hoverIndexRef  = useRef<number | null>(null)

  // Mouse-drag state
  const isDragging     = useRef(false)
  const dragStartX     = useRef(0)
  const dragScrollLeft = useRef(0)
  const hasDragged     = useRef(false)

  // Snap state
  const snapTimer      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSnapping     = useRef(false)
  const snapTarget     = useRef(0)

  // Single rAF pass: update arrow opacity + active-card class
  const sync = useCallback(() => {
    const el = ref.current
    if (!el) return

    const atLeft  = el.scrollLeft <= 2
    const atRight = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2

    const lb = leftBtnRef.current
    const rb = rightBtnRef.current
    if (lb) {
      lb.style.opacity       = atLeft  ? '0' : '1'
      lb.style.pointerEvents = atLeft  ? 'none' : 'auto'
    }
    if (rb) {
      rb.style.opacity       = atRight ? '0' : '1'
      rb.style.pointerEvents = atRight ? 'none' : 'auto'
    }

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
    // When a card is hovered, visually emphasise it instead of the scroll-centered card.
    // onActiveIndexChange still reflects scroll position (not hover) for the preview fallback.
    const hi = hoverIndexRef.current
    const effectiveIdx = (hi !== null && hi >= 0 && hi < cards.length) ? hi : closestIdx

    cards.forEach((card, i) => {
      const should = i === effectiveIdx
      if (card.classList.contains('carousel-card-active') !== should) {
        card.classList.toggle('carousel-card-active', should)
      }
    })

    if (closestIdx !== lastActiveIdx.current) {
      lastActiveIdx.current = closestIdx
      onActiveIndexChangeRef.current?.(closestIdx)
    }
  }, [])

  const scheduleSync = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(sync)
  }, [sync])

  // Snap to the card whose center is closest to the carousel center
  const snapToNearestCard = useCallback(() => {
    const el = ref.current
    if (!el || isSnapping.current) return

    const cards = Array.from(el.children).filter(
      c => (c as HTMLElement).classList.contains('media-card')
    ) as HTMLElement[]
    if (cards.length === 0) return

    const center = el.scrollLeft + el.clientWidth / 2
    let closest: HTMLElement | null = null
    let minDist = Infinity
    cards.forEach(card => {
      const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center)
      if (dist < minDist) { minDist = dist; closest = card }
    })
    if (!closest) return

    const targetLeft = (closest as HTMLElement).offsetLeft
      + (closest as HTMLElement).offsetWidth / 2
      - el.clientWidth / 2

    if (Math.abs(el.scrollLeft - targetLeft) < 2) return

    snapTarget.current  = targetLeft
    isSnapping.current  = true
    el.scrollTo({ left: targetLeft, behavior: 'smooth' })
    // Release snap lock after generous smooth-scroll window
    setTimeout(() => { isSnapping.current = false }, 800)
  }, [])

  // Debounce: schedule snap after scroll has been quiet for SNAP_SETTLE_MS
  const scheduleSnap = useCallback(() => {
    const el = ref.current
    if (!el) return
    // If a snap is running and we've reached the target, release the lock early
    if (isSnapping.current && Math.abs(el.scrollLeft - snapTarget.current) < 2) {
      isSnapping.current = false
    }
    if (isSnapping.current) return
    if (snapTimer.current) clearTimeout(snapTimer.current)
    snapTimer.current = setTimeout(snapToNearestCard, SNAP_SETTLE_MS)
  }, [snapToNearestCard])

  // When the parent changes which card is hovered, update the ref and re-sync
  // the carousel-card-active class immediately without waiting for a scroll event.
  useEffect(() => {
    hoverIndexRef.current = hoverIndex ?? null
    scheduleSync()
  }, [hoverIndex, scheduleSync])

  // Attach scroll + resize listeners
  useEffect(() => {
    const el = ref.current
    if (!el) return
    scheduleSync()
    const ro = new ResizeObserver(scheduleSync)
    ro.observe(el)
    el.addEventListener('scroll', scheduleSync, { passive: true })
    el.addEventListener('scroll', scheduleSnap, { passive: true })
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', scheduleSync)
      el.removeEventListener('scroll', scheduleSnap)
      cancelAnimationFrame(rafRef.current)
      if (snapTimer.current) clearTimeout(snapTimer.current)
    }
  }, [scheduleSync, scheduleSnap])

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

  // Mouse drag — attached to the DOM element so we can listen on window for
  // mousemove/mouseup (finger can leave the carousel bounds during a fast drag)
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      // Don't hijack clicks on interactive children (buttons, inputs, etc.)
      const target = e.target as HTMLElement
      if (target.closest('button, input, select, textarea, [contenteditable]')) return

      isDragging.current     = true
      hasDragged.current     = false
      dragStartX.current     = e.clientX
      dragScrollLeft.current = el.scrollLeft
      el.style.cursor                = 'grabbing'
      document.body.style.userSelect = 'none'
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const delta = dragStartX.current - e.clientX
      if (Math.abs(delta) > DRAG_THRESHOLD) hasDragged.current = true
      el.scrollLeft = dragScrollLeft.current + delta
    }

    const onMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current             = false
      el.style.cursor                = ''
      document.body.style.userSelect = ''
      // If mouseup lands off the carousel, no click event fires and hasDragged
      // would stay set, silently swallowing the next clean click. Reset it after
      // any pending synthetic click (which fires synchronously before this task).
      setTimeout(() => { hasDragged.current = false }, 0)
    }

    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
      document.body.style.userSelect = ''
    }
  }, [])

  function scrollDir(dir: number) {
    ref.current?.scrollBy({ left: dir * SCROLL_STEP, behavior: 'smooth' })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const t = e.target as HTMLElement
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) return
    if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollDir(-1) }
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollDir(1) }
  }

  // Click handler: suppress navigation only when the pointer was released after a drag.
  // All clean clicks fall through to the card's own <Link> regardless of active state.
  function handleClick(e: React.MouseEvent) {
    if (hasDragged.current) {
      e.preventDefault()
      e.stopPropagation()
      hasDragged.current = false
    }
  }

  /*
    Arrow button base style.
    Width: 80px — wide enough to be an obvious, easy-to-hit target.
    top/bottom: 0 — covers the full carousel height (including padding).
    z-index: 10 — above card z-index (3–6) so the gradient overlay renders
    on top; arrows remain clickable even when a card is scaled near the edge.
  */
  const arrowBase: React.CSSProperties = {
    position:   'absolute',
    top:        0,
    bottom:     0,
    width:      '80px',
    display:    'flex',
    alignItems: 'center',
    cursor:     'pointer',
    zIndex:     10,
    background: 'none',
    border:     'none',
    padding:    0,
    transition: 'opacity 0.2s ease',
  }

  return (
    /*
      overflow: visible on the wrapper is critical.
      Scaled cards must be able to visually escape the wrapper boundary.
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
          left:           0,
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
          right:          0,
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
        onClickCapture={handleClick}
        className="carousel-scroll"
      >
        {children}
      </div>
    </div>
  )
}
