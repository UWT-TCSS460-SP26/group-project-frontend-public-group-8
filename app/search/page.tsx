'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { searchMovies, searchTV } from '@/lib/api'
import type { MovieSearchResult, TVSearchResult } from '@/lib/api'

// A basic map of common TMDB genre IDs to string names
const genreMap: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics'
}

// Extract unique, sorted genre names for the dropdown
const allGenres = Array.from(new Set(Object.values(genreMap))).sort()

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
  gap: '1rem',
}

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '8px',
  overflow: 'hidden',
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
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

function SearchContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const type = searchParams.get('type') ?? 'all'

  const [movies, setMovies] = useState<MovieSearchResult[]>([])
  const [tvShows, setTvShows] = useState<TVSearchResult[]>([])
  const [moviePage, setMoviePage] = useState(1)
  const [tvPage, setTvPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMoreMovies, setHasMoreMovies] = useState(true)
  const [hasMoreTv, setHasMoreTv] = useState(true)
  
  const [genreFilter, setGenreFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  useEffect(() => {
    setMovies([])
    setTvShows([])
    setMoviePage(1)
    setTvPage(1)
    setHasMoreMovies(true)
    setHasMoreTv(true)
    
    if (q.trim()) {
      void fetchInitialResults()
    }
  }, [q, type])

  const fetchInitialResults = async () => {
    setLoading(true)
    try {
      const [moviesRes, tvRes] = await Promise.all([
        type === 'all' || type === 'movie' ? searchMovies(q, 1) : Promise.resolve(null),
        type === 'all' || type === 'tv' ? searchTV(q, 1) : Promise.resolve(null)
      ])
      if (moviesRes) {
        setMovies(moviesRes.results)
        setHasMoreMovies(moviesRes.page < moviesRes.totalPages)
      }
      if (tvRes) {
        setTvShows(tvRes.results)
        setHasMoreTv(tvRes.page < tvRes.totalPages)
      }
    } catch (error) {
      console.error("Search failed", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (loading || (!hasMoreMovies && !hasMoreTv)) return
    
    setLoading(true)
    try {
      const [moviesRes, tvRes] = await Promise.all([
        (type === 'all' || type === 'movie') && hasMoreMovies ? searchMovies(q, moviePage + 1) : Promise.resolve(null),
        (type === 'all' || type === 'tv') && hasMoreTv ? searchTV(q, tvPage + 1) : Promise.resolve(null)
      ])
      if (moviesRes) {
        setMovies(prev => [...prev, ...moviesRes.results])
        setMoviePage(moviesRes.page)
        setHasMoreMovies(moviesRes.page < moviesRes.totalPages)
      }
      if (tvRes) {
        setTvShows(prev => [...prev, ...tvRes.results])
        setTvPage(tvRes.page)
        setHasMoreTv(tvRes.page < tvRes.totalPages)
      }
    } catch (error) {
      console.error("Failed to load more results", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      // Trigger when user is within 500px of the bottom
      if (window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 500) return
      
      if (hasMoreMovies || hasMoreTv) {
        void loadMore()
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loading, hasMoreMovies, hasMoreTv, q, type, moviePage, tvPage])

  const filteredMovies = useMemo(() => {
    return movies.filter(m => {
      const year = m.releaseDate?.slice(0, 4)
      const matchesYear = !yearFilter || year === yearFilter
      
      const movieGenres = (m.genreIds || []).map(id => genreMap[id]).filter(Boolean)
      const matchesGenre = !genreFilter || movieGenres.includes(genreFilter)
      
      return matchesYear && matchesGenre
    })
  }, [movies, yearFilter, genreFilter])

  const filteredTvShows = useMemo(() => {
    return tvShows.filter(s => {
      const year = s.firstAirDate?.slice(0, 4)
      const matchesYear = !yearFilter || year === yearFilter
      
      const showGenres = (s.genreIds || []).map(id => genreMap[id]).filter(Boolean)
      const matchesGenre = !genreFilter || showGenres.includes(genreFilter)

      return matchesYear && matchesGenre
    })
  }, [tvShows, yearFilter, genreFilter])

  if (!q.trim()) {
    return (
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Enter a search term in the bar above.</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginTop: 0, fontSize: '1.5rem', marginBottom: '1rem' }}>
          Results for &ldquo;{q}&rdquo;
          {type !== 'all' && (
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '1rem', marginLeft: '0.5rem' }}>
              · {type === 'movie' ? 'Movies' : 'TV Shows'}
            </span>
          )}
        </h1>
        
        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
             <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Filter by Genre</label>
             <select 
               value={genreFilter} 
               onChange={e => setGenreFilter(e.target.value)}
               style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
             >
               <option value="">All Genres</option>
               {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
             </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
             <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Filter by Year</label>
             <input 
               type="text"
               placeholder="e.g. 2023"
               value={yearFilter}
               onChange={e => setYearFilter(e.target.value)}
               style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', width: '120px' }}
             />
          </div>
        </div>
      </div>

      {filteredMovies.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Movies</h2>
          <div style={gridStyle}>
            {filteredMovies.map((m) => (
              <Link key={m.id} href={`/media/movie/${m.id}`} style={cardStyle}>
                {m.posterUrl ? (
                  <img src={m.posterUrl} alt={m.title} style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }} />
                ) : (
                  <div style={posterPlaceholderStyle}>No poster</div>
                )}
                <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>{m.releaseDate?.slice(0, 4)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {filteredTvShows.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>TV Shows</h2>
          <div style={gridStyle}>
            {filteredTvShows.map((s) => (
              <Link key={s.id} href={`/media/tv/${s.id}`} style={cardStyle}>
                {s.posterUrl ? (
                  <img src={s.posterUrl} alt={s.name} style={{ width: '100%', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }} />
                ) : (
                  <div style={posterPlaceholderStyle}>No poster</div>
                )}
                <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>{s.firstAirDate?.slice(0, 4)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading more results...
        </div>
      )}
      
      {!loading && filteredMovies.length === 0 && filteredTvShows.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>No results found for &ldquo;{q}&rdquo; with the current filters.</p>
      )}
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>Loading search...</div>}>
      <SearchContent />
    </Suspense>
  )
}
