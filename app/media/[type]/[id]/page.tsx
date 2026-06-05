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
        <p role="alert" style={{ color: 'var(--error)' }}>Could not load details: {msg}</p>
      </main>
    )
  }

  const { metadata: m, community, recentReviews } = data
  const isTV = type === 'tv'

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* ── Hero row ── */}
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          marginBottom: '2.5rem',
          alignItems: 'flex-start',
        }}
      >
        {/* Poster */}
        <div style={{ flexShrink: 0, position: 'relative' }}>
          {m.poster_url ? (
            <img
              src={m.poster_url}
              alt={m.title}
              style={{
                width: '200px',
                borderRadius: '10px',
                display: 'block',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px var(--border)',
              }}
            />
          ) : (
            <div
              style={{
                width: '200px',
                aspectRatio: '2/3',
                background: 'var(--placeholder-bg)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-faint)',
                fontSize: '0.8rem',
                border: '1px solid var(--border)',
              }}
            >
              No poster
            </div>
          )}
        </div>

        {/* Metadata */}
        <div style={{ flex: 1, minWidth: '240px' }}>
          <p style={{
            margin: '0 0 0.4rem',
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: isTV ? 'var(--violet)' : 'var(--accent)',
          }}>
            {isTV ? 'TV Show' : 'Movie'}
          </p>

          <h1 style={{ margin: '0 0 0.5rem', lineHeight: 1.15, fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>
            {m.title}
          </h1>

          <p style={{ margin: '0 0 1rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {m.year}
            {m.genre ? ` · ${m.genre}` : ''}
            {isTV && m.seasons != null && ` · ${m.seasons} season${m.seasons !== 1 ? 's' : ''}`}
            {isTV && m.episodes != null && `, ${m.episodes} ep.`}
          </p>

          {/* Community aggregate */}
          {community.ratingCount > 0 ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.875rem',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              marginBottom: '1.25rem',
            }}>
              <span style={{ color: '#f59e0b', fontSize: '1.1rem' }}>★</span>
              <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                {community.averageRating != null ? community.averageRating.toFixed(1) : '—'}
              </span>
              <span style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>
                {community.ratingCount} rating{community.ratingCount !== 1 ? 's' : ''}
              </span>
              {community.reviewCount > 0 && (
                <span style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>
                  · {community.reviewCount} review{community.reviewCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          ) : (
            <p style={{ margin: '0 0 1.25rem', color: 'var(--text-faint)', fontSize: '0.85rem' }}>
              No community ratings yet.
            </p>
          )}

          <p style={{ margin: 0, lineHeight: 1.75, color: 'var(--text-secondary)', fontSize: '0.93rem' }}>
            {m.summary}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'linear-gradient(to right, var(--accent), transparent)', marginBottom: '2rem', opacity: 0.4 }} />

      {/* Interactive section */}
      <RatingSection
        titleId={m.id}
        mediaType={type as 'movie' | 'tv'}
        initialReviews={recentReviews}
        reviewCount={community.reviewCount}
      />
    </main>
  )
}
