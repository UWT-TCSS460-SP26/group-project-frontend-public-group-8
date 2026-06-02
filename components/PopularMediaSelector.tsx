'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getPopularMovies, getPopularTV } from '@/lib/api'
import type { MovieSummary, TVSummary } from '@/lib/api'
import HoverCarousel from './HoverCarousel'

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '8px',
  overflow: 'hidden',
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
  minWidth: '150px',
  maxWidth: '150px',
  flexShrink: 0,
}

const posterPlaceholderStyle: React.CSSProperties = {
  width: '100%',
  aspectRatio: '2/3',
  background: 'var(--placeholder-bg)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  color: 'var(--text-faint)',
}

const cardBodyStyle: React.CSSProperties = {
  padding: '0.5rem 0.6rem 0.6rem',
}

export default function PopularMediaSelector() {
  const [selected, setSelected] = useState<'movies' | 'tv'>('movies')
  
  const [movies, setMovies] = useState<MovieSummary[]>([])
  const [moviePage, setMoviePage] = useState(1)
  const [loadingMovies, setLoadingMovies] = useState(false)
  const [hasMoreMovies, setHasMoreMovies] = useState(true)

  const [shows, setShows] = useState<TVSummary[]>([])
  const [tvPage, setTvPage] = useState(1)
  const [loadingTv, setLoadingTv] = useState(false)
  const [hasMoreTv, setHasMoreTv] = useState(true)

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingMovies(true)
      setLoadingTv(true)
      try {
        const [moviesRes, tvRes] = await Promise.all([
          getPopularMovies(1),
          getPopularTV(1)
        ])
        setMovies(moviesRes.results)
        setHasMoreMovies(moviesRes.page < moviesRes.totalPages)
        setShows(tvRes.results)
        setHasMoreTv(tvRes.page < tvRes.totalPages)
      } catch (error) {
        console.error("Failed to fetch initial popular media", error)
      } finally {
        setLoadingMovies(false)
        setLoadingTv(false)
      }
    }
    fetchInitialData()
  }, [])

  const handleScrollEnd = async () => {
    if (selected === 'movies' && hasMoreMovies && !loadingMovies) {
      setLoadingMovies(true)
      try {
        const nextPage = moviePage + 1
        const res = await getPopularMovies(nextPage)
        setMovies(prev => [...prev, ...res.results])
        setMoviePage(nextPage)
        setHasMoreMovies(res.page < res.totalPages)
      } catch (error) {
        console.error("Failed to load more movies", error)
      } finally {
        setLoadingMovies(false)
      }
    } else if (selected === 'tv' && hasMoreTv && !loadingTv) {
      setLoadingTv(true)
      try {
        const nextPage = tvPage + 1
        const res = await getPopularTV(nextPage)
        setShows(prev => [...prev, ...res.results])
        setTvPage(nextPage)
        setHasMoreTv(res.page < res.totalPages)
      } catch (error) {
        console.error("Failed to load more TV shows", error)
      } finally {
        setLoadingTv(false)
      }
    }
  }

  return (
    <section style={{ marginBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Popular Titles</h2>
        <select 
          value={selected} 
          onChange={(e) => setSelected(e.target.value as 'movies' | 'tv')}
          style={{
            padding: '0.4rem 0.8rem',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            background: 'var(--background)',
            color: 'var(--foreground)',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          <option value="movies">Movies</option>
          <option value="tv">TV Shows</option>
        </select>
      </div>

      <HoverCarousel onScrollEnd={handleScrollEnd}>
        {selected === 'movies' ? (
          movies.length === 0 && !loadingMovies ? (
            <p style={{ color: 'var(--text-faint)' }}>No movies returned.</p>
          ) : (
            <>
              {movies.map((m) => (
                <Link key={m.id} href={`/media/movie/${m.id}`} style={cardStyle}>
                  {m.posterUrl ? (
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={posterPlaceholderStyle}>No poster</div>
                  )}
                  <div style={cardBodyStyle}>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.title}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                      {m.releaseDate?.slice(0, 4)}
                    </p>
                  </div>
                </Link>
              ))}
              {loadingMovies && <div style={{ minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}
            </>
          )
        ) : (
          shows.length === 0 && !loadingTv ? (
            <p style={{ color: 'var(--text-faint)' }}>No TV shows returned.</p>
          ) : (
            <>
              {shows.map((s) => (
                <Link key={s.id} href={`/media/tv/${s.id}`} style={cardStyle}>
                  {s.posterUrl ? (
                    <img
                      src={s.posterUrl}
                      alt={s.name}
                      style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={posterPlaceholderStyle}>No poster</div>
                  )}
                  <div style={cardBodyStyle}>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                      {s.firstAirDate?.slice(0, 4)}
                    </p>
                  </div>
                </Link>
              ))}
              {loadingTv && <div style={{ minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}
            </>
          )
        )}
      </HoverCarousel>
    </section>
  )
}
