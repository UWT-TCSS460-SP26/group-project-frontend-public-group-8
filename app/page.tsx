'use client'

import HeroSearch from '@/components/HeroSearch'
import PopularMediaSelector from '@/components/PopularMediaSelector'
import CommunityFavorites from '@/components/CommunityFavorites'
import RecentActivity from '@/components/RecentActivity'
import GenreCarousel from '@/components/GenreCarousel'
import CompactToggle from '@/components/CompactToggle'
import { useMedia } from '@/lib/MediaContext'

export default function Home() {
  const { mediaType, isInitialized } = useMedia()
  
  const tvGenres = [
    { slug: 'action_adventure', title: 'Action & Adventure' },
    { slug: 'animation', title: 'Animation' },
    { slug: 'comedy', title: 'Comedy' },
    { slug: 'crime', title: 'Crime' },
    { slug: 'documentary', title: 'Documentary' },
    { slug: 'drama', title: 'Drama' },
    { slug: 'Kids', title: 'Kids' },
    { slug: 'Family', title: 'Family' },
    { slug: 'mystery', title: 'Mystery' },
    { slug: 'news', title: 'News' },
    { slug: 'reality', title: 'Reality' },
    { slug: 'sci_fi_fantasy', title: 'Sci-Fi & Fantasy' },
    { slug: 'soap', title: 'Soap' },
    { slug: 'talk', title: 'Talk' },
    { slug: 'war_politics', title: 'War & Politics' },
    { slug: 'western', title: 'Western' },
  ]

  const movieGenres = [
    { slug: 'Action', title: 'Action' },
    { slug: 'Adventure', title: 'Adventure' },
    { slug: 'Animation', title: 'Animation' },
    { slug: 'Comedy', title: 'Comedy' },
    { slug: 'Crime', title: 'Crime' },
    { slug: 'Documentary', title: 'Documentary' },
    { slug: 'Drama', title: 'Drama' },
    { slug: 'Family', title: 'Kids' },
    { slug: 'Family', title: 'Family' },
    { slug: 'Fantasy', title: 'Fantasy' },
    { slug: 'History', title: 'History' },
    { slug: 'Horror', title: 'Horror' },
    { slug: 'Music', title: 'Music' },
    { slug: 'Mystery', title: 'Mystery' },
    { slug: 'Romance', title: 'Romance' },
    { slug: 'Science Fiction', title: 'Science Fiction' },
    { slug: 'Thriller', title: 'Thriller' },
    { slug: 'tv_movie', title: 'TV Movie' },
    { slug: 'war', title: 'War' },
    { slug: 'western', title: 'Western' },
  ]


  const activeGenres = mediaType === 'tv' ? tvGenres : movieGenres

  if (!isInitialized) return null

  const tabBase: React.CSSProperties = {
    padding: '0.4rem 1.2rem',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  }

  const tabActive: React.CSSProperties = {
    ...tabBase,
    background: 'var(--accent)',
    color: '#000',
    borderColor: 'var(--accent)',
    boxShadow: '0 0 15px rgba(0, 212, 255, 0.3)',
  }

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <HeroSearch />

      {/* Card display-mode toggle — affects all carousels on the page */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '0.75rem 0 0.25rem' }}>
        <CompactToggle />
      </div>

      <RecentActivity />

      <PopularMediaSelector />

      <CommunityFavorites />

      {/* Genre section divider and selector */}
      <div style={{ margin: '2.5rem 0 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, var(--accent), transparent)', boxShadow: '0 0 6px rgba(0,255,255,0.4)' }} />
          <h2 className="section-heading" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            Browse by Genre
          </h2>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, var(--accent), transparent)', boxShadow: '0 0 6px rgba(0,255,255,0.4)' }} />
        </div>
      </div>

      {activeGenres.map((g, idx) => (
        <GenreCarousel
          key={`${mediaType}-${idx}`}
          genre={g.slug}
          title={g.title}
          mediaType={mediaType}
        />
      ))}
    </main>
  )
}
