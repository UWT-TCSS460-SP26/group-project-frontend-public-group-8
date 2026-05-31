const BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://tcss-460-group-7.onrender.com'
).replace(/\/$/, '')

export async function apiFetch<T>(path: string, token?: string): Promise<T> {
  const headers: HeadersInit = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    headers,
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status}: ${text.slice(0, 200)}`)
  }

  return res.json() as Promise<T>
}

export async function apiMutate<T>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  token: string,
  body?: unknown,
): Promise<T> {
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status}: ${text.slice(0, 200)}`)
  }

  return res.json() as Promise<T>
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MovieSummary {
  id: number
  title: string
  overview: string
  releaseDate: string
  posterUrl: string | null
  voteAverage: number
  popularity: number
}

export interface TVSummary {
  id: number
  name: string
  overview: string
  firstAirDate: string
  posterUrl: string | null
  voteAverage: number
  popularity: number
}

export interface MovieSearchResult {
  id: number
  title: string
  originalTitle: string
  overview: string
  releaseDate: string
  genreIds: number[]
  popularity: number
  voteAverage: number
  voteCount: number
  originalLanguage: string
  posterPath: string | null
  posterUrl: string | null
  backdropPath: string | null
  backdropUrl: string | null
}

export interface TVSearchResult {
  id: number
  name: string
  originalName: string
  overview: string
  firstAirDate: string
  genreIds: number[]
  popularity: number
  voteAverage: number
  voteCount: number
  originalLanguage: string
  posterPath: string | null
  posterUrl: string | null
  backdropPath: string | null
  backdropUrl: string | null
}

export interface PopularMoviesResponse {
  page: number
  totalPages: number
  totalResults: number
  results: MovieSummary[]
}

export interface PopularTVResponse {
  page: number
  totalPages: number
  totalResults: number
  results: TVSummary[]
}

export interface MovieSearchResponse {
  page: number
  totalPages: number
  totalResults: number
  results: MovieSearchResult[]
}

export interface TVSearchResponse {
  page: number
  totalPages: number
  totalResults: number
  results: TVSearchResult[]
}

export interface EnrichedMediaMetadata {
  id: number
  title: string
  genre: string
  year: string
  summary: string
  poster_url: string | null
  episodes?: number | null
  seasons?: number | null
}

export interface CommunityAggregate {
  averageRating: number | null
  ratingCount: number
  reviewCount: number
}

export interface ReviewAuthor {
  id: number
  username: string
  display_name: string | null
}

export interface ReviewPreview {
  id: number
  authorId: number | null
  header: string | null
  content: string | null
  upvotes: number
  downvotes: number
  createdAt: string
  author: ReviewAuthor | null
}

export interface EnrichedMediaResponse {
  mediaType: 'movie' | 'tv'
  metadata: EnrichedMediaMetadata
  community: CommunityAggregate
  recentReviews: ReviewPreview[]
}

// ─── Ratings ─────────────────────────────────────────────────────────────────

export interface RatingAuthor {
  id: number
  display_name: string | null
}

export interface Rating {
  id: number
  authorId: number
  rating: number
  title_id: number
  author: RatingAuthor
}

export interface RatingResponse {
  data: Rating
}

export interface MyRatingItem {
  id: number
  title_id: number
  media_type: 'movie' | 'tv' | null
  rating: number
  metadata: EnrichedMediaMetadata | null
}

export interface MyRatingsResponse {
  data: MyRatingItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export interface Review {
  id: number
  authorId: number | null
  title_id: number
  content: string
  header: string | null
  upvotes: number
  downvotes: number
  createdAt: string
  author: ReviewAuthor | null
}

export interface MyReviewItem {
  id: number
  title_id: number
  media_type: 'movie' | 'tv' | null
  content: string | null
  header: string | null
  upvotes: number
  downvotes: number
  createdAt: string
  metadata: EnrichedMediaMetadata | null
}

export interface MyReviewsResponse {
  data: MyReviewItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// ─── API helpers ─────────────────────────────────────────────────────────────

export function submitRating(titleId: number, rating: number, mediaType: 'movie' | 'tv', token: string) {
  return apiMutate<RatingResponse>('POST', `/v1/ratings/${titleId}`, token, { rating, media_type: mediaType })
}

export function updateRating(titleId: number, rating: number, mediaType: 'movie' | 'tv', token: string) {
  return apiMutate<RatingResponse>('PATCH', `/v1/ratings/${titleId}`, token, { rating, media_type: mediaType })
}

export function deleteRating(titleId: number, token: string) {
  return apiMutate<RatingResponse>('DELETE', `/v1/ratings/${titleId}`, token)
}

export function getUserRatingForTitle(authorId: number, titleId: number, token: string) {
  return apiFetch<RatingResponse>(
    `/v1/ratings/user/${authorId}/title/${titleId}`,
    token,
  )
}

export function createReview(
  titleId: number,
  mediaType: 'movie' | 'tv',
  content: string,
  header: string,
  token: string,
) {
  return apiMutate<Review>('POST', `/v1/reviews`, token, {
    title_id: titleId,
    media_type: mediaType,
    content,
    header: header || undefined,
  })
}

export function updateReview(reviewId: number, content: string, header: string, token: string) {
  return apiMutate<Review>('PUT', `/v1/reviews/${reviewId}`, token, {
    content,
    header: header || undefined,
  })
}

export function deleteReview(reviewId: number, token: string) {
  return apiMutate<Review>('DELETE', `/v1/reviews/${reviewId}`, token)
}

export function getMyRatings(token: string, page = 1) {
  return apiFetch<MyRatingsResponse>(`/v1/users/me/ratings?page=${page}`, token)
}

export function getMyReviews(token: string, page = 1) {
  return apiFetch<MyReviewsResponse>(`/v1/users/me/reviews?page=${page}`, token)
}

export function syncUser(
  username: string,
  email: string,
  token: string,
  display_name?: string,
) {
  return apiMutate('POST', '/v1/users', token, { username, email, display_name })
}
