'use client'

import { signOut } from 'next-auth/react'

/** True when an error from an authed request indicates an expired/invalid token. */
export function isAuthError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e)
  return msg.includes('401')
}

/**
 * If the error is a 401 (expired/invalid bearer token), sign the user out and
 * return true. Callers can short-circuit their own error handling when true.
 */
export function signOutIfAuthError(e: unknown): boolean {
  if (isAuthError(e)) {
    void signOut({ callbackUrl: '/' })
    return true
  }
  return false
}
