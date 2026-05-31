import Link from 'next/link'
import { auth, signIn, signOut } from '@/auth'
import ThemeToggle from '@/components/ThemeToggle'

export default async function Header() {
  const session = await auth()

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        gap: '1rem',
        flexWrap: 'wrap',
        background: 'var(--bg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link
          href="/"
          style={{ fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none', color: 'inherit' }}
        >
          CineTrack
        </Link>
        <nav style={{ display: 'flex', gap: '1.25rem' }}>
          <Link href="/browse" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Browse
          </Link>
          <Link href="/search" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Search
          </Link>
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ThemeToggle />

        {session?.user ? (
          <>
            <Link
              href="/profile"
              style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none' }}
            >
              {session.user.email}
            </Link>
            <form
              action={async (_: FormData) => {
                'use server'
                await signOut({ redirectTo: '/' })
              }}
            >
              <button
                type="submit"
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
            </form>
          </>
        ) : (
          <form
            action={async (_: FormData) => {
              'use server'
              await signIn('tcss460')
            }}
          >
            <button
              type="submit"
              style={{
                cursor: 'pointer',
                padding: '0.375rem 0.875rem',
                background: 'var(--accent)',
                color: 'var(--accent-text)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              Sign In
            </button>
          </form>
        )}
      </div>
    </header>
  )
}
