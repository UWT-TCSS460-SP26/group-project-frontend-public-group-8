import HeroSearch from '@/components/HeroSearch'
import PopularMediaSelector from '@/components/PopularMediaSelector'
import CommunityFavorites from '@/components/CommunityFavorites'
import RecentActivity from '@/components/RecentActivity'
import GenreCarousel from '@/components/GenreCarousel'

export default function Home() {
  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <HeroSearch />

      <RecentActivity />

      <PopularMediaSelector />

      <CommunityFavorites />

      {/* Genre section divider */}
      <div style={{ margin: '1.5rem 0 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, var(--accent), transparent)' }} />
        <h2 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', whiteSpace: 'nowrap' }}>
          Browse by Genre
        </h2>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, var(--accent), transparent)' }} />
      </div>

      <GenreCarousel genre="animation"       title="Animation" />
      <GenreCarousel genre="drama"           title="Gripping Dramas" />
      <GenreCarousel genre="crime"           title="Crime Thrillers" />
      <GenreCarousel genre="action_adventure" title="Action & Adventure" />
      <GenreCarousel genre="comedy"          title="Comedy" />
      <GenreCarousel genre="documentary"     title="Documentaries" />
      <GenreCarousel genre={['kids', 'family']} title="Kids & Family" />
      <GenreCarousel genre="reality"        title="Reality TV" />
      <GenreCarousel genre="sci_fi_fantasy" title="Sci-Fi & Fantasy" />
    </main>
  )
}
