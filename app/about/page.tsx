import { Orbitron } from 'next/font/google'
import Link from 'next/link'

const orbitron = Orbitron({ subsets: ['latin'], weight: ['700', '900'] })

const team = [
  {
    name: 'Caleb Ernst',
    roles: [
      'Back-end: Prisma setup, migrations & JWT auth middleware (dev-login)',
      'Back-end: GET /v1/media/:id route (TMDB details + community reviews)',
      'Back-end: integration tests & stubAuth test middleware',
      'Front-end: cyberpunk design system — glass navbar, cinematic hero, detail pages',
      'Front-end: light mode, mobile fixes, auth error page, TMDB image config',
    ],
  },
  {
    name: 'Charlene Jarrell',
    roles: [
      'Back-end: POST /v1/reviews + single review/rating GET handlers',
      'Back-end: validation & null-safety bug fixes (controllers, validateNumericId)',
      'Back-end: Sprint-4 admin bug-report stories (list / update / delete) + tests',
      'API documentation (ratings, reviews, media, auth) & OpenAPI spec',
      'Test infrastructure (Prisma mock, JWT setup), sprint planning & PR integration',
    ],
  },
  {
    name: 'Christina Blackwell',
    roles: [
      'Primary back-end developer & repo maintainer',
      'Core media API: popular & search routes (movies/TV), get-by-id, pagination',
      'TMDB service layer + community top-rated movie/TV endpoints',
      'Prisma schema (roles, resolveLocalUser upsert, duplicate-guard 409s), CORS & Render deploy',
      'Front-end: home page & search features, login & genre-retrieval fixes',
    ],
  },
  {
    name: 'Mansur Yassin',
    roles: [
      'Back-end: public GET /v1/reviews & /v1/ratings, /health endpoint',
      'Back-end: POST /v1/issues bug-report + safe error handling; author identity & /me routes',
      'Back-end: partner-facing README + env-driven CORS; proxy/integration tests',
      'Front-end: Magic 8-Ball recommender (nav popup)',
      'Front-end: Sprint 7 ratings/reviews/profile + authenticated writes; dark mode',
    ],
  },
]

const services = [
  {
    name: 'Group 7 API',
    description:
      'Our upstream partner group whose REST API powers every browse, search, detail, rating, and review interaction in Screen8.',
    href: 'https://tcss-460-group-7.onrender.com',
  },
  {
    name: 'TMDB',
    description:
      'The Movie Database — the source of all movie and TV metadata: posters, titles, genres, release dates, episode counts, and more.',
    href: 'https://www.themoviedb.org',
  },
  {
    name: 'Auth²',
    description:
      'The shared OAuth2 / OIDC identity service provided by the course that handles secure sign-in for all student projects.',
  },
  {
    name: 'TCSS 460 Token Playground',
    description:
      'The course-provided token playground used to inspect and test JWT access tokens during development.',
  },
]

export default function AboutPage() {
  return (
    <main
      style={{
        maxWidth: '860px',
        margin: '0 auto',
        padding: '3rem 1.5rem 5rem',
        color: 'var(--text)',
      }}
    >
      {/* Page heading */}
      <h1
        className={orbitron.className}
        style={{
          fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
          fontWeight: 900,
          color: 'var(--accent)',
          textShadow:
            '0 0 14px rgba(0,212,255,0.70), 0 0 36px rgba(0,212,255,0.30)',
          marginBottom: '0.35rem',
          letterSpacing: '0.04em',
        }}
      >
        About Screen8
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1rem' }}>
        A movie & TV community built for TCSS 460 · Spring 2026
      </p>

      {/* The team */}
      <section
        className="section-panel"
        style={{ padding: '1.75rem 2rem', marginBottom: '2rem', borderRadius: '12px' }}
      >
        <h2
          className={orbitron.className}
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '1.25rem',
          }}
        >
          The Team
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {team.map((member) => (
            <div
              key={member.name}
              style={{
                background: 'rgba(0,212,255,0.04)',
                border: '1px solid rgba(0,212,255,0.15)',
                borderRadius: '8px',
                padding: '1.1rem 1.25rem',
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: 'var(--text)',
                  marginBottom: '0.5rem',
                }}
              >
                {member.name}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {member.roles.map((role) => (
                  <li
                    key={role}
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      paddingLeft: '0.9rem',
                      position: 'relative',
                      marginBottom: '0.2rem',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: 0,
                        color: 'var(--accent)',
                      }}
                    >
                      ›
                    </span>
                    {role}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Powered by */}
      <section
        className="section-panel"
        style={{ padding: '1.75rem 2rem', marginBottom: '2rem', borderRadius: '12px' }}
      >
        <h2
          className={orbitron.className}
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--violet)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '1.25rem',
          }}
        >
          Powered By
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {services.map((svc) => (
            <div
              key={svc.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid rgba(0,212,255,0.08)',
              }}
            >
              <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                {svc.href ? (
                  <Link
                    href={svc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent)', textDecoration: 'none' }}
                  >
                    {svc.name} ↗
                  </Link>
                ) : (
                  svc.name
                )}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                {svc.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Build story */}
      <section
        className="section-panel"
        style={{ padding: '1.75rem 2rem', borderRadius: '12px' }}
      >
        <h2
          className={orbitron.className}
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '1rem',
          }}
        >
          The Build
        </h2>
        <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.75, margin: 0 }}>
          Screen8 started as a Next.js shell and grew quarter-long into a full media community
          — browse, search, rate, and review movies and TV shows backed by a live REST API.
          The biggest surprises were how much coordination a front-end/back-end split actually
          takes, and how rewarding it feels when the pieces finally snap together. If we were
          starting over we'd write integration tests earlier and agree on API contracts before
          a single component got built. We're proud of what we shipped.
        </p>
      </section>
    </main>
  )
}
