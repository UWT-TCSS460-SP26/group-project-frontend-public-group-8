import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { apiFetch, ApiError } from '@/lib/api'
import type { UserRatingsResponse, UserReviewsResponse } from '@/lib/api'
import OwnedRating from '@/components/OwnedRating'
import OwnedReview from '@/components/OwnedReview'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await auth()
  const token = session?.accessToken
  if (!token) redirect('/api/auth/signin?callbackUrl=/profile')

  let ratingsErr: string | null = null
  let reviewsErr: string | null = null
  let ratings: UserRatingsResponse['data'] = []
  let reviews: UserReviewsResponse['data'] = []

  try {
    const r = await apiFetch<UserRatingsResponse>('/v1/users/me/ratings', {
      token,
      revalidate: false,
    })
    ratings = r.data ?? []
  } catch (e) {
    ratingsErr = e instanceof ApiError ? `Couldn't load ratings (${e.status}).` : 'Network error loading ratings.'
  }

  try {
    const r = await apiFetch<UserReviewsResponse>('/v1/users/me/reviews', {
      token,
      revalidate: false,
    })
    reviews = r.data ?? []
  } catch (e) {
    reviewsErr = e instanceof ApiError ? `Couldn't load reviews (${e.status}).` : 'Network error loading reviews.'
  }

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.25rem' }}>Your profile</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {session?.user?.email ?? 'Signed in'} · everything you&rsquo;ve rated and reviewed
        </p>
      </header>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
          Your ratings {ratings.length > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({ratings.length})</span>}
        </h2>
        {ratingsErr ? (
          <p role="alert" style={{ color: 'var(--error)', fontSize: '0.9rem' }}>{ratingsErr}</p>
        ) : ratings.length === 0 ? (
          <p style={{ color: 'var(--text-faint)' }}>You haven&rsquo;t rated anything yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {ratings.map((r) => (
              <OwnedRating key={`${r.title_id}-${r.id}`} rating={r} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
          Your reviews {reviews.length > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({reviews.length})</span>}
        </h2>
        {reviewsErr ? (
          <p role="alert" style={{ color: 'var(--error)', fontSize: '0.9rem' }}>{reviewsErr}</p>
        ) : reviews.length === 0 ? (
          <p style={{ color: 'var(--text-faint)' }}>You haven&rsquo;t written any reviews yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map((r) => (
              <OwnedReview key={r.id} review={r} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}