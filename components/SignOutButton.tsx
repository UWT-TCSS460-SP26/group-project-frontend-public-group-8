'use client'

import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={() => signOut({ callbackUrl: '/' })}
      style={{ height: '32px', padding: '0 0.75rem', fontSize: '0.8rem' }}
    >
      Sign Out
    </button>
  )
}
