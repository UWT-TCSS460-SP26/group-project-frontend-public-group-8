import Link from 'next/link'
import { auth, signIn, signOut } from '@/auth'

export default async function Header() {
  const session = await auth()

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid #e5e7eb',
        gap: '1rem',
        flexWrap: 'wrap',
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
          <Link href="/browse" style={{ textDecoration: 'none', color: '#6b7280', fontSize: '0.9rem' }}>
            Browse
          </Link>
          <Link href="/search" style={{ textDecoration: 'none', color: '#6b7280', fontSize: '0.9rem' }}>
            Search
          </Link>
        </nav>
      </div>

      {session?.user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#555' }}>{session.user.email}</span>
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
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'transparent',
                fontSize: '0.875rem',
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
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
              background: '#1a73e8',
              color: '#fff',
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
    </header>
  )
}
