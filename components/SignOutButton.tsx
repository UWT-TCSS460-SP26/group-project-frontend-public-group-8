'use client'

import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      style={{
        cursor: 'pointer',
        padding: '0.375rem 0.75rem',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        background: 'transparent',
        fontSize: '0.875rem',
        color: 'var(--text)',
      }}
    >
      Sign Out
    </button>
  )
}
