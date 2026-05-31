import Link from 'next/link'
import { auth, signIn } from '@/auth'
import ThemeToggle from '@/components/ThemeToggle'
import SignOutButton from '@/components/SignOutButton'
import NavSearch from '@/components/NavSearch'

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', flex: 1 }}>
        <Link
          href="/"
          style={{ fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none', color: 'inherit', flexShrink: 0 }}
        >
          CineTrack
        </Link>
        <NavSearch />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <ThemeToggle />

        {session?.user ? (
          <>
            <Link
              href="/profile"
              style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none' }}
            >
              Hi, {session.user.name?.split(' ')[0] ?? session.user.email}
            </Link>
            <SignOutButton />
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
