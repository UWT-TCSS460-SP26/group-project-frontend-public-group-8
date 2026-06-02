'use client'

import { useRef, useEffect } from 'react'

export function useHoverScroll<T extends HTMLElement>(
  onScrollEnd?: () => void,
  edgeThreshold = 100,
  scrollSpeed = 2, // Slower speed
) {
  const ref = useRef<T>(null)
  const isAtEnd = useRef(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let animationFrameId: number
    let direction = 0 // -1 for left, 1 for right, 0 for none

    const scrollLoop = () => {
      if (direction !== 0) {
        element.scrollLeft += direction * scrollSpeed
      }

      // Check if scrolled to the end
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

      if (x < edgeThreshold) {
        direction = -1
      } else if (x > width - edgeThreshold) {
        direction = 1
      } else {
        direction = 0
      }
    }

    const handleMouseLeave = () => {
      direction = 0
    }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)
    
    animationFrameId = requestAnimationFrame(scrollLoop)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [onScrollEnd, edgeThreshold, scrollSpeed])

  return ref
}
