'use server'

import { signIn } from '@/auth'

export async function handleSignIn(callbackUrl?: string) {
  await signIn('tcss460', { redirectTo: callbackUrl || '/' })
}
