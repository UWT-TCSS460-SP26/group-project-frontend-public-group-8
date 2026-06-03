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
      {/* Left neon arrow — thin transparent fade, no card-obscuring shader */}
      {showArrows && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: '1rem',
            width: '40px',
            background: 'linear-gradient(to right, rgba(2,8,16,0.75) 0%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingLeft: '2px',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,255,0.8)) drop-shadow(0 0 16px rgba(0,255,255,0.4))', opacity: 0.95 }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
      )}

      {/* Right neon arrow — thin transparent fade, no card-obscuring shader */}
      {showArrows && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: '1rem',
            width: '40px',
            background: 'linear-gradient(to left, rgba(2,8,16,0.75) 0%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '2px',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,255,0.8)) drop-shadow(0 0 16px rgba(0,255,255,0.4))', opacity: 0.95 }}
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
