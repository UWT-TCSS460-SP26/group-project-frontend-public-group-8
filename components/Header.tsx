import Link from 'next/link'
import { auth, signIn, signOut } from '@/auth'
import ThemeToggle from '@/components/ThemeToggle'
import NavSearch from '@/components/NavSearch'

export default async function Header() {
  const session = await auth()

  // First name for the signed-in user, falling back to the email handle.
  const firstName =
    session?.user?.name?.trim().split(/\s+/)[0] ||
    session?.user?.email?.split('@')[0] ||
    'Profile'

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
      <Link
        href="/"
        style={{ fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none', color: 'inherit', flexShrink: 0 }}
      >
        CineTrack
      </Link>

      <NavSearch />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ThemeToggle />

        {session?.user ? (
          <>
            <Link
              href="/profile"
              style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}
            >
              {firstName}
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
