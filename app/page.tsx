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
      
      <section style={{ marginBottom: '1rem', marginTop: '4rem' }}>
        <h2 style={{ fontSize: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          Explore by Genre
        </h2>
      </section>
      
      <GenreCarousel genre="animation" title="Animation" />
      <GenreCarousel genre="drama" title="Gripping Dramas" />
      <GenreCarousel genre="crime" title="Crime Thrillers" />
      <GenreCarousel genre="action_adventure" title="Action & Adventure" />
      <GenreCarousel genre="comedy" title="Comedy" />
      <GenreCarousel genre="documentary" title="Documentaries" />
      <GenreCarousel genre={['kids', 'family']} title="Kids & Family" />
      <GenreCarousel genre="reality" title="Reality TV" />
      <GenreCarousel genre="sci_fi_fantasy" title="Sci-Fi & Fantasy" />
    </main>
  )
}
