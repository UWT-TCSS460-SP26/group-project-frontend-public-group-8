'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getPopularMovies, getPopularTV } from '@/lib/api'
import type { MovieSummary, TVSummary } from '@/lib/api'
import HoverCarousel from './HoverCarousel'

const CARD_WIDTH = 185

function CardSkeleton() {
  return (
    <div style={{ minWidth: CARD_WIDTH, maxWidth: CARD_WIDTH, flexShrink: 0 }}>
      <div className="skeleton" style={{ width: '100%', aspectRatio: '2/3', borderRadius: '8px 8px 0 0' }} />
      <div style={{ padding: '0.5rem 0.6rem 0.6rem', background: 'var(--card-bg)', borderRadius: '0 0 8px 8px', border: '1px solid var(--border)', borderTop: 'none' }}>
        <div className="skeleton" style={{ height: '12px', width: '80%', marginBottom: '6px' }} />
        <div className="skeleton" style={{ height: '10px', width: '40%' }} />
      </div>
    </div>
  )
}

function MovieCard({ m }: { m: MovieSummary }) {
  return (
    <Link href={`/media/movie/${m.id}`} className="media-card"
      style={{ minWidth: CARD_WIDTH, maxWidth: CARD_WIDTH, flexShrink: 0 }}>
      {m.posterUrl ? (
        <img src={m.posterUrl} alt={m.title}
          style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--placeholder-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-faint)' }}>
          No poster
        </div>
      )}
      <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
        <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {m.title}
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
          {m.releaseDate?.slice(0, 4)}
        </p>
      </div>
    </Link>
  )
}

function TVCard({ s }: { s: TVSummary }) {
  return (
    <Link href={`/media/tv/${s.id}`} className="media-card"
      style={{ minWidth: CARD_WIDTH, maxWidth: CARD_WIDTH, flexShrink: 0 }}>
      {s.posterUrl ? (
        <img src={s.posterUrl} alt={s.name}
          style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--placeholder-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-faint)' }}>
          No poster
        </div>
      )}
      <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
        <p style={{ fontWeight: 600, fontSize: '0.82rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {s.name}
        </p>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
          {s.firstAirDate?.slice(0, 4)}
        </p>
      </div>
    </Link>
  )
}

const tabBase: React.CSSProperties = {
  padding: '0.3rem 0.875rem',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-muted)',
  fontSize: '0.82rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
  letterSpacing: '0.03em',
}

const tabActive: React.CSSProperties = {
  ...tabBase,
  background: 'var(--accent)',
  color: 'var(--accent-text)',
  borderColor: 'var(--accent)',
}

export default function PopularMediaSelector() {
  const [selected, setSelected] = useState<'movies' | 'tv'>('movies')
  const [movies, setMovies] = useState<MovieSummary[]>([])
  const [moviePage, setMoviePage] = useState(1)
  const [loadingMovies, setLoadingMovies] = useState(true)
  const [hasMoreMovies, setHasMoreMovies] = useState(true)
  const [shows, setShows] = useState<TVSummary[]>([])
  const [tvPage, setTvPage] = useState(1)
  const [loadingTv, setLoadingTv] = useState(true)
  const [hasMoreTv, setHasMoreTv] = useState(true)

  useEffect(() => {
    Promise.all([getPopularMovies(1), getPopularTV(1)])
      .then(([moviesRes, tvRes]) => {
        setMovies(moviesRes.results)
        setHasMoreMovies(moviesRes.page < moviesRes.totalPages)
        setShows(tvRes.results)
        setHasMoreTv(tvRes.page < tvRes.totalPages)
      })
      .catch(console.error)
      .finally(() => { setLoadingMovies(false); setLoadingTv(false) })
  }, [])

  const handleScrollEnd = async () => {
    if (selected === 'movies' && hasMoreMovies && !loadingMovies) {
      setLoadingMovies(true)
      try {
        const next = moviePage + 1
        const res = await getPopularMovies(next)
        setMovies(prev => [...prev, ...res.results])
        setMoviePage(next)
        setHasMoreMovies(res.page < res.totalPages)
      } catch { /* silent */ } finally { setLoadingMovies(false) }
    } else if (selected === 'tv' && hasMoreTv && !loadingTv) {
      setLoadingTv(true)
      try {
        const next = tvPage + 1
        const res = await getPopularTV(next)
        setShows(prev => [...prev, ...res.results])
        setTvPage(next)
        setHasMoreTv(res.page < res.totalPages)
      } catch { /* silent */ } finally { setLoadingTv(false) }
    }
  }

  const isLoading = selected === 'movies' ? loadingMovies : loadingTv
  const items = selected === 'movies' ? movies : shows
  const showSkeletons = isLoading && items.length === 0

  return (
    <section className="section-panel" style={{ marginBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 className="section-heading" style={{ margin: 0 }}>Featured</h2>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={() => setSelected('movies')}
            style={selected === 'movies' ? tabActive : tabBase}
            aria-pressed={selected === 'movies'}
          >
            Movies
          </button>
          <button
            onClick={() => setSelected('tv')}
            style={selected === 'tv' ? tabActive : tabBase}
            aria-pressed={selected === 'tv'}
          >
            TV Shows
          </button>
        </div>
      </div>

      <HoverCarousel onScrollEnd={handleScrollEnd}>
        {showSkeletons
          ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
          : selected === 'movies'
            ? movies.map(m => <MovieCard key={m.id} m={m} />)
            : shows.map(s => <TVCard key={s.id} s={s} />)}
        {isLoading && items.length > 0 && (
          <div style={{ minWidth: CARD_WIDTH, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: '0.8rem' }}>
            Loading…
          </div>
        )}
      </HoverCarousel>
    </section>
  )
}
