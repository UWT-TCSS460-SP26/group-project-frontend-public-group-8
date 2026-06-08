'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { searchMovies, searchTV } from '@/lib/api'
import type { MovieSearchResult, TVSearchResult } from '@/lib/api'

export default function HeroSearch() {
  const [query, setQuery] = useState('')
  const [movies, setMovies] = useState<MovieSearchResult[]>([])
  const [shows, setShows] = useState<TVSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setMovies([])
      setShows([])
      setShowDropdown(false)
      return
    }
    const id = setTimeout(async () => {
      setLoading(true)
      try {
        const [moviesRes, tvRes] = await Promise.all([searchMovies(query), searchTV(query)])
        setMovies(moviesRes.results.slice(0, 3))
        setShows(tvRes.results.slice(0, 3))
        setShowDropdown(true)
      } catch { /* silent */ } finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(id)
  }, [query])

  return (
    <section
      style={{
        marginBottom: '3rem',
        borderRadius: '12px',
        position: 'relative',
        background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-muted) 40%, var(--bg-subtle) 70%, var(--bg) 100%)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Cyberpunk grid texture — clipped to section bounds — REMOVED for cleaner look */}
      {/* Top neon accent line — cyan → magenta */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, transparent 0%, var(--accent) 30%, var(--violet) 70%, transparent 100%)',
          boxShadow: '0 0 12px rgba(0,255,255,0.5), 0 0 24px rgba(255,0,204,0.3)',
        }}
      />
      {/* Bottom neon accent line */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.3) 40%, rgba(255,0,204,0.3) 60%, transparent 100%)',
        }}
      />

      <div style={{ position: 'relative', padding: '3.5rem 2rem 3rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.75rem', marginTop: 0 }}>
          Discover · Rate · Review
        </p>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', margin: '0 0 0.5rem', lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.01em' }}>
          Find your next{' '}
          <span style={{ color: 'var(--accent)', textShadow: '0 0 16px rgba(0,255,255,0.7), 0 0 36px rgba(0,255,255,0.35)' }}>
            favorite
          </span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Search movies and TV shows. Rate, review, and share.
        </p>

        <div ref={wrapperRef} style={{ position: 'relative', maxWidth: '580px', margin: '0 auto' }}>
          <input
            type="search"
            placeholder="Search for a title…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search movies and TV shows"
            style={{
              width:        '100%',
              padding:      '0.875rem 1.5rem',
              fontSize:     '1rem',
              borderRadius: '8px',
              borderWidth:  '1.5px',
              borderStyle:  'solid',
              borderColor:  'var(--input-border)',
              background:   'var(--input-bg)',
              color:        'var(--text)',
              outline:      'none',
              boxShadow:    '0 0 0 0 transparent',
              transition:   'border-color 0.15s, box-shadow 0.15s',
              boxSizing:    'border-box',
            }}
            onFocus={(e) => {
              if (query.trim().length >= 2) setShowDropdown(true)
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent), 0 0 20px rgba(0,255,255,0.2), 0 0 40px rgba(0,255,255,0.08)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--input-border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />

          {showDropdown && (movies.length > 0 || shows.length > 0 || loading) && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'var(--bg-muted)',
              border: '1px solid var(--accent)',
              borderRadius: '8px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,229,255,0.12)',
              zIndex: 200,
              textAlign: 'left',
              overflow: 'hidden',
            }}>
              {loading ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Searching…</div>
              ) : (
                <>
                  {movies.length > 0 && (
                    <>
                      <div style={{ padding: '0.4rem 1rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--bg-subtle)' }}>
                        Movies
                      </div>
                      {movies.map(m => (
                        <Link key={`m-${m.id}`} href={`/media/movie/${m.id}`}
                          onClick={() => setShowDropdown(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.625rem 1rem', textDecoration: 'none', color: 'inherit', borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-muted)')}
                        >
                          {m.posterUrl
                            ? <img src={m.posterUrl} alt={m.title} style={{ width: '36px', height: '54px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                            : <div style={{ width: '36px', height: '54px', background: 'var(--placeholder-bg)', borderRadius: '4px', flexShrink: 0 }} />}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.title}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.releaseDate?.slice(0, 4)}</div>
                          </div>
                        </Link>
                      ))}
                    </>
                  )}
                  {shows.length > 0 && (
                    <>
                      <div style={{ padding: '0.4rem 1rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--violet)', background: 'var(--bg-subtle)' }}>
                        TV Shows
                      </div>
                      {shows.map(s => (
                        <Link key={`tv-${s.id}`} href={`/media/tv/${s.id}`}
                          onClick={() => setShowDropdown(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.625rem 1rem', textDecoration: 'none', color: 'inherit', borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-muted)')}
                        >
                          {s.posterUrl
                            ? <img src={s.posterUrl} alt={s.name} style={{ width: '36px', height: '54px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                            : <div style={{ width: '36px', height: '54px', background: 'var(--placeholder-bg)', borderRadius: '4px', flexShrink: 0 }} />}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.firstAirDate?.slice(0, 4)}</div>
                          </div>
                        </Link>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
