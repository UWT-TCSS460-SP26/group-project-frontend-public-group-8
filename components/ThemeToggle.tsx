'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark')
  }, [])

  function toggle() {
    const next = dark ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
    setDark(!dark)
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        cursor: 'pointer',
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '0.375rem 0.625rem',
        fontSize: '0.875rem',
        color: 'var(--text)',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {dark ? 'Light mode' : 'Dark mode'}
    </button>
  )
}
