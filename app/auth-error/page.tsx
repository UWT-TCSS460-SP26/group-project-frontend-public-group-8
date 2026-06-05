'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Suspense } from 'react'

const errorMessages: Record<string, { heading: string; body: string }> = {
  AccessDenied: {
    heading: 'Account not active',
    body: 'Your account exists in the system but has not been activated yet. Please check your email for an activation link, or contact your instructor / administrator to enable your account.',
  },
  Configuration: {
    heading: 'Configuration error',
    body: 'The authentication service is misconfigured. Please contact the site administrator.',
  },
  Verification: {
    heading: 'Link expired',
    body: 'This sign-in link has expired or has already been used. Please request a new one.',
  },
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const errorCode = searchParams?.get('error') ?? 'Unknown'
  const info = errorMessages[errorCode] ?? {
    heading: 'Sign-in error',
    body: `Something went wrong during sign-in (error code: ${errorCode}). Please try again or contact support if the problem persists.`,
  }

  return (
    <main style={{ maxWidth: '480px', margin: '6rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
      <div style={{
        padding: '2.5rem 2rem',
        border: '1px solid var(--error)',
        borderRadius: '12px',
        background: 'rgba(248,113,113,0.05)',
      }}>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--error)' }}>
          Authentication Error
        </p>
        <h1 style={{ margin: '0 0 1rem', fontSize: '1.4rem', fontWeight: 800 }}>{info.heading}</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 2rem', fontSize: '0.95rem' }}>
          {info.body}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => signIn('tcss460')} className="btn-primary">
            Try again
          </button>
          <Link href="/" className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 1.25rem', textDecoration: 'none' }}>
            Go home
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  )
}
