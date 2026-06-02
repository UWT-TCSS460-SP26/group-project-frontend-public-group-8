'use client'

import { handleSignIn } from '@/lib/actions'

interface SignInButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  callbackUrl?: string
}

export default function SignInButton({ callbackUrl, children, ...props }: SignInButtonProps) {
  return (
    <form action={() => handleSignIn(callbackUrl)}>
      <button type="submit" {...props}>
        {children}
      </button>
    </form>
  )
}
