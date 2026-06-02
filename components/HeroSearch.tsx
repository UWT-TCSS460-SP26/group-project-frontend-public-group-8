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
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
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

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true)
      try {
        const [moviesRes, tvRes] = await Promise.all([
          searchMovies(query),
          searchTV(query)
        ])
        setMovies(moviesRes.results.slice(0, 3))
        setShows(tvRes.results.slice(0, 3))
        setShowDropdown(true)
      } catch (error) {
        console.error("Search failed", error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  return (
    <div style={{ marginBottom: '3rem' }}>
      <div 
        style={{
          background: 'linear-gradient(135deg, var(--border), var(--background))',
          padding: '3rem 2rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}
      >
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', marginTop: 0 }}>Find your next favorite</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Search movies and TV shows across our platform.</p>
        
        <div ref={wrapperRef} style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
          <input
            type="text"
            placeholder="Search for titles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (query.trim().length >= 2) setShowDropdown(true) }}
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              fontSize: '1.1rem',
              borderRadius: '30px',
              border: '2px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              outline: 'none',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          />
          
          {showDropdown && (movies.length > 0 || shows.length > 0 || loading) && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '0.5rem',
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
              zIndex: 10,
              textAlign: 'left',
              overflow: 'hidden'
            }}>
              {loading ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Searching...</div>
              ) : (
                <>
                  {movies.length > 0 && (
                    <div>
                      <div style={{ padding: '0.5rem 1rem', background: 'var(--placeholder-bg)', fontSize: '0.8rem', fontWeight: 'bold' }}>MOVIES</div>
                      {movies.map(m => (
                        <Link 
                          key={`movie-${m.id}`} 
                          href={`/media/movie/${m.id}`}
                          onClick={() => setShowDropdown(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem 1rem',
                            textDecoration: 'none',
                            color: 'inherit',
                            borderBottom: '1px solid var(--border)'
                          }}
                        >
                          {m.posterUrl ? (
                            <img src={m.posterUrl} alt={m.title} style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                          ) : (
                            <div style={{ width: '40px', height: '60px', background: 'var(--placeholder-bg)', borderRadius: '4px' }} />
                          )}
                          <div>
                            <div style={{ fontWeight: 600 }}>{m.title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.releaseDate?.slice(0,4)}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {shows.length > 0 && (
                    <div>
                      <div style={{ padding: '0.5rem 1rem', background: 'var(--placeholder-bg)', fontSize: '0.8rem', fontWeight: 'bold' }}>TV SHOWS</div>
                      {shows.map(s => (
                        <Link 
                          key={`tv-${s.id}`} 
                          href={`/media/tv/${s.id}`}
                          onClick={() => setShowDropdown(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem 1rem',
                            textDecoration: 'none',
                            color: 'inherit',
                            borderBottom: '1px solid var(--border)'
                          }}
                        >
                          {s.posterUrl ? (
                            <img src={s.posterUrl} alt={s.name} style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                          ) : (
                            <div style={{ width: '40px', height: '60px', background: 'var(--placeholder-bg)', borderRadius: '4px' }} />
                          )}
                          <div>
                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.firstAirDate?.slice(0,4)}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
