const BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://tcss-460-group-7.onrender.com'
).replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  body: string
  constructor(status: number, body: string) {
    super(`${status}: ${body.slice(0, 200)}`)
    this.status = status
    this.body = body
  }
}

export async function apiFetch<T>(
  path: string,
  opts: { token?: string; revalidate?: number | false } = {}
): Promise<T> {
  const headers: HeadersInit = {}
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`

  const next: { revalidate?: number } = {}
  let cache: RequestCache | undefined
  if (opts.revalidate === false) cache = 'no-store'
  else next.revalidate = opts.revalidate ?? 60

  const res = await fetch(`${BASE}${path}`, { headers, next, cache })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ApiError(res.status, text)
  }
  return res.json() as Promise<T>
}

export async function apiWrite<T>(
  path: string,
  opts: {
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    token: string
    body?: unknown
  }
): Promise<T | null> {
  const headers: HeadersInit = { Authorization: `Bearer ${opts.token}` }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ApiError(res.status, text)
  }
  if (res.status === 204) return null
  const text = await res.text()
  return text ? (JSON.parse(text) as T) : null
}

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

export interface UserRating {
  id: number
  title_id: number
  media_type: 'movie' | 'tv' | null
  rating: number
  metadata: EnrichedMediaMetadata | null
}

export interface UserReview {
  id: number
  title_id: number
  media_type: 'movie' | 'tv' | null
  header: string | null
  content: string | null
  upvotes: number
  downvotes: number
  createdAt: string
  metadata: EnrichedMediaMetadata | null
}

export interface UserRatingsResponse {
  data: UserRating[]
  page?: number
  totalPages?: number
}
export interface UserReviewsResponse {
  data: UserReview[]
  page?: number
  totalPages?: number
}