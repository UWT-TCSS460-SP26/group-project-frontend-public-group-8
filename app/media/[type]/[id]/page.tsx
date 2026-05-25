import { notFound } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import type { EnrichedMediaResponse } from '@/lib/api'

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
        <p style={{ color: '#dc2626' }}>Could not load details: {msg}</p>
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
              background: '#e5e7eb',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              flexShrink: 0,
            }}
          >
            No poster
          </div>
        )}

        <div style={{ flex: 1, minWidth: '260px' }}>
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {mediaLabel}
          </p>
          <h1 style={{ margin: '0 0 0.5rem', lineHeight: 1.2 }}>{m.title}</h1>

          <p style={{ margin: '0 0 0.75rem', color: '#6b7280', fontSize: '0.95rem' }}>
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
              <span style={{ color: '#6b7280', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                community average &middot; {community.ratingCount} rating{community.ratingCount !== 1 ? 's' : ''}
              </span>
            </p>
          ) : (
            <p style={{ margin: '0 0 1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
              No community ratings yet.
            </p>
          )}

          <p style={{ margin: 0, lineHeight: 1.7, color: '#374151' }}>{m.summary}</p>

          <p
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1rem',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#6b7280',
            }}
          >
            Sign in to rate — rating &amp; reviews arrive in Sprint 7.
          </p>
        </div>
      </div>

      {/* Reviews */}
      <section>
        <h2 style={{ marginBottom: '1rem' }}>
          Community Reviews{community.reviewCount > 0 ? ` (${community.reviewCount})` : ''}
        </h2>

        {recentReviews.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No reviews yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentReviews.map((r) => (
              <div
                key={r.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1rem 1.25rem',
                }}
              >
                {r.header && (
                  <p style={{ fontWeight: 700, margin: '0 0 0.5rem', fontSize: '1rem' }}>
                    {r.header}
                  </p>
                )}
                {r.content && (
                  <p style={{ margin: '0 0 0.75rem', lineHeight: 1.6, color: '#374151' }}>
                    {r.content}
                  </p>
                )}
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
                  {r.author ? (r.author.display_name ?? r.author.username) : 'Anonymous'}
                  {' · '}
                  {new Date(r.createdAt).toLocaleDateString()}
                  {' · '}
                  ↑{r.upvotes} ↓{r.downvotes}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
