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
