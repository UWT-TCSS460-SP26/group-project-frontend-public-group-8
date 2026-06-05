'use client'

import { useState } from 'react'

interface StarRatingProps {
  value: number | null
  onChange: (rating: number) => void
  disabled?: boolean
  size?: number
}

export default function StarRating({ value, onChange, disabled = false, size = 30 }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const displayed = hovered ?? value ?? 0

  return (
    <div role="group" aria-label="Star rating" style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= displayed
        return (
          <button
            key={star}
            type="button"
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            aria-pressed={star === value}
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => !disabled && setHovered(star)}
            onMouseLeave={() => !disabled && setHovered(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: disabled ? 'default' : 'pointer',
              padding: '2px',
              fontSize: `${size}px`,
              lineHeight: 1,
              color: active ? '#f59e0b' : 'var(--border)',
              filter: active ? 'drop-shadow(0 0 4px rgba(245,158,11,0.55))' : 'none',
              transition: 'color 0.1s, filter 0.1s',
            }}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}
