'use client'

import { useRef, useEffect, useState } from 'react'

interface Props {
  children: React.ReactNode
  onScrollEnd?: () => void
}

const edgeThreshold = 100
const scrollSpeed = 2

export default function HoverCarousel({ children, onScrollEnd }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const isAtEnd = useRef(false)
  const [showArrows, setShowArrows] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const checkScrollable = () => {
      setShowArrows(element.scrollWidth > element.clientWidth)
    }

    checkScrollable()
    const timeoutId = setTimeout(checkScrollable, 500)

    let animationFrameId: number
    let direction = 0

    const scrollLoop = () => {
      if (direction !== 0) {
        element.scrollLeft += direction * scrollSpeed
      }
      const atEnd = element.scrollLeft >= element.scrollWidth - element.clientWidth - 1
      if (atEnd && !isAtEnd.current) {
        isAtEnd.current = true
        onScrollEnd?.()
      } else if (!atEnd) {
        isAtEnd.current = false
      }
      animationFrameId = requestAnimationFrame(scrollLoop)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX } = e
      const { left, width } = element.getBoundingClientRect()
      const x = clientX - left
      if (x < edgeThreshold) direction = -1
      else if (x > width - edgeThreshold) direction = 1
      else direction = 0
    }

    const handleMouseLeave = () => { direction = 0 }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)
    animationFrameId = requestAnimationFrame(scrollLoop)

    return () => {
      clearTimeout(timeoutId)
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [onScrollEnd])

  return (
    <div style={{ position: 'relative' }}>
      {/* Left fade + arrow */}
      {showArrows && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: '1rem',
            width: '72px',
            background: 'linear-gradient(to right, var(--bg) 20%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingLeft: '0.4rem',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.5))', opacity: 0.85 }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
      )}

      {/* Right fade + arrow */}
      {showArrows && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: '1rem',
            width: '72px',
            background: 'linear-gradient(to left, var(--bg) 20%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '0.4rem',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.5))', opacity: 0.85 }}
          >
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </div>
      )}

      <div
        ref={ref}
        style={{
          display: 'flex',
          overflowX: 'hidden',
          gap: '0.875rem',
          paddingBottom: '0.75rem',
        }}
      >
        {children}
      </div>
    </div>
  )
}
