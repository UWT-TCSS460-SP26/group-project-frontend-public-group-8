'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect } from 'react'

/**
 * Invisible component that signs the user out as soon as their access token
 * expires, whether the page is sitting open or they navigate to a new one.
 */
export default function TokenExpiryWatcher() {
  const { data: session } = useSession()
  const expires = session?.accessTokenExpires

  useEffect(() => {
    if (!expires) return
    const ms = expires - Date.now()
    if (ms <= 0) {
      signOut({ callbackUrl: '/' })
      return
    }
    const id = setTimeout(() => signOut({ callbackUrl: '/' }), ms)
    return () => clearTimeout(id)
  }, [expires])

  return null
}
