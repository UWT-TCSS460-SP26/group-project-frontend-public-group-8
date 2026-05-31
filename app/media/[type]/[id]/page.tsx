import { notFound } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import type { EnrichedMediaResponse } from '@/lib/api'
import RatingSection from '@/components/RatingSection'

interface Props {
  params: Promise<{ type: string; id: string }>
}

export default async function MediaDetailPage({ params }: Props) {
  const { type, id } = await params

  if (type !== 'movie' && type !== 'tv') notFound()

  let data: EnrichedMediaResponse
  try {
    data = await apiFetch<EnrichedMediaResponse>(`/v1/media/${type}/${id}`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.startsWith('404')) notFound()
    return (
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <p style={{ color: 'var(--error)' }}>Could not load details: {msg}</p>
      </main>
    )
  }

  const { metadata: m, community, recentReviews } = data
  const mediaLabel = type === 'tv' ? 'TV Show' : 'Movie'

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Title + Poster */}
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          marginBottom: '2.5rem',
          alignItems: 'flex-start',
        }}
      >
        {m.poster_url ? (
          <img
            src={m.poster_url}
            alt={m.title}
            style={{ width: '220px', borderRadius: '8px', flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: '220px',
              aspectRatio: '2/3',
              background: 'var(--placeholder-bg)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-faint)',
              flexShrink: 0,
            }}
          >
            No poster
          </div>
        )}

        <div style={{ flex: 1, minWidth: '260px' }}>
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {mediaLabel}
          </p>
          <h1 style={{ margin: '0 0 0.5rem', lineHeight: 1.2 }}>{m.title}</h1>

          <p style={{ margin: '0 0 0.75rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {m.year}
            {m.genre ? ` · ${m.genre}` : ''}
            {type === 'tv' && m.seasons != null && ` · ${m.seasons} season${m.seasons !== 1 ? 's' : ''}`}
            {type === 'tv' && m.episodes != null && `, ${m.episodes} ep.`}
          </p>

          {community.ratingCount > 0 ? (
            <p style={{ margin: '0 0 1rem', fontSize: '1rem' }}>
              <strong style={{ fontSize: '1.1rem' }}>
                ★ {community.averageRating != null ? community.averageRating.toFixed(1) : '—'}
              </strong>
              <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                community average &middot; {community.ratingCount} rating{community.ratingCount !== 1 ? 's' : ''}
              </span>
            </p>
          ) : (
            <p style={{ margin: '0 0 1rem', color: 'var(--text-faint)', fontSize: '0.875rem' }}>
              No community ratings yet.
            </p>
          )}

          <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{m.summary}</p>
        </div>
      </div>

      {/* Interactive rating + reviews (client component, handles auth state) */}
      <RatingSection
        titleId={m.id}
        mediaType={type as 'movie' | 'tv'}
        initialReviews={recentReviews}
        reviewCount={community.reviewCount}
      />
    </main>
  )
}
