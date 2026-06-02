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
        padding: '0 1.5rem',
        height: '56px',
        borderBottom: '1px solid var(--accent)',
        gap: '1rem',
        flexWrap: 'wrap',
        background: 'rgba(8, 13, 20, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 0 rgba(0, 229, 255, 0.08), 0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Left: logo + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: 0 }}>
        <Link
          href="/"
          aria-label="Screen8 home"
          style={{
            fontWeight: 800,
            fontSize: '1.15rem',
            textDecoration: 'none',
            color: 'var(--accent)',
            flexShrink: 0,
            letterSpacing: '0.04em',
            textShadow: '0 0 12px rgba(0, 229, 255, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '1px',
          }}
        >
          Screen
          <img
            src="/icon.svg"
            alt="8"
            style={{ height: '1em', verticalAlign: 'middle', marginTop: '-0.1em' }}
          />
        </Link>
        <NavSearch />
      </div>

      {/* Right: user area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
        {session?.user ? (
          <>
            <Link
              href="/profile"
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                transition: 'color 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={undefined}
            >
              Hi,{' '}
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                {session.user.name?.split(' ')[0] ?? session.user.email}
              </span>
            </Link>
            <SignOutButton />
            <ThemeToggle />
          </>
        ) : (
          <>
            <form
              action={async (_: FormData) => {
                'use server'
                await signIn('tcss460')
              }}
            >
              <button
                type="submit"
                className="btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.875rem' }}
              >
                Sign In
              </button>
            </form>
            <ThemeToggle />
          </>
        )}
      </div>
    </header>
  )
}
