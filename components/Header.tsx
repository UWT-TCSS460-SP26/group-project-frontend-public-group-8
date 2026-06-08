import Link from 'next/link'
import { auth, signIn } from '@/auth'
import ThemeToggle from '@/components/ThemeToggle'
import SignOutButton from '@/components/SignOutButton'
import NavSearch from '@/components/NavSearch'
import EightBallLauncher from '@/components/EightBallLauncher'
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], weight: '700' })

export default async function Header() {
  const session = await auth()

  return (
    <header
      className="header-root"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
        height: '56px',
        borderBottom: '1px solid rgba(0,255,255,0.4)',
        gap: '1rem',
        background: 'rgba(2, 8, 16, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow:
          '0 1px 0 rgba(0,255,255,0.15), 0 0 30px rgba(0,255,255,0.06), 0 4px 24px rgba(0,0,0,0.8)',
      }}
    >
      {/* Left: logo */}
      <div
        className="header-left"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          flexShrink: 0,
        }}
      >
        <Link
          href="/"
          aria-label="Screen 8 home"
          style={{
            fontFamily: playfair.style.fontFamily,
            fontWeight: 700,
            fontSize: '1.15rem',
            textDecoration: 'none',
            color: 'var(--logo)',
            flexShrink: 0,
            textShadow:
              '0 0 12px rgba(0, 255, 255, 0.7), 0 0 28px rgba(0, 255, 255, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '1px',
          }}
        >
          Screen8
        </Link>
        <Link
          href="/about"
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            padding: '0.3rem 0.5rem',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            transition: 'color 0.15s, border-color 0.15s',
            flexShrink: 0,
          }}
        >
          About
        </Link>
      </div>

      {/* Center: search — flex:1 fills available space; justify-content centers the
          form within that space once the form hits its own maxWidth cap (560px). */}
      <div
        className="header-center"
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          minWidth: 0,
        }}
      >
        <NavSearch />
      </div>

      {/* Right: user area */}
      <div
        className="header-right"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          flexShrink: 0,
        }}
      >
        <EightBallLauncher />
        {session?.user ? (
          <>
            <Link
              href="/profile"
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
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
