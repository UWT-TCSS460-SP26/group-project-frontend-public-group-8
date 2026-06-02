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
      if (element.scrollWidth > element.clientWidth) {
        setShowArrows(true)
      }
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

    const handleMouseLeave = () => {
      direction = 0
    }

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
      {showArrows && (
        <>
          {/* Left Arrow */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: '1rem',
            width: '80px',
            background: 'linear-gradient(to right, var(--background) 20%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingLeft: '0.5rem',
            pointerEvents: 'none',
            zIndex: 10,
            color: 'var(--foreground)', // Set color for currentColor to inherit
          }}>
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" // Use currentColor
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{
                filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))',
                opacity: 0.8
              }}
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </div>
          {/* Right Arrow */}
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: '1rem',
            width: '80px',
            background: 'linear-gradient(to left, var(--background) 20%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '0.5rem',
            pointerEvents: 'none',
            zIndex: 10,
            color: 'var(--foreground)', // Set color for currentColor to inherit
          }}>
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" // Use currentColor
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{
                filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))',
                opacity: 0.8
              }}
            >
              <polyline points="9 6 15 12 9 18"></polyline>
            </svg>
          </div>
        </>
      )}
      <div ref={ref} style={{
        display: 'flex',
        overflowX: 'hidden',
        gap: '1rem',
        paddingBottom: '1rem',
      }}>
        {children}
      </div>
    </div>
  )
}
