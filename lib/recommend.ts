// Magic 8-Ball recommender: types, constants, and the draw logic.
// Runs client-side (like the rest of the home-page components), calling the
// Group 7 API helpers in lib/api.ts directly.

import {
  getPopularMovies,
  getPopularTV,
  searchMovieByGenre,
  searchTVByGenre,
} from '@/lib/api'

export type MediaType = 'movie' | 'tv'
export type MediaFilter = MediaType | 'both'

export interface RecFilters {
  mediaType: MediaFilter
  /** TMDB genre *name* (e.g. "Science Fiction"), or null for "any genre". */
  genre: string | null
}

export interface RecItem {
  id: number
  type: MediaType
  title: string
  year: string
  posterUrl: string | null
  overview: string
  voteAverage: number
  /** A classic 8-ball verdict, chosen per draw for flavor. */
  verdict: string
}

/** Which genre names Group 7's API accepts per media type (verified live). */
export interface GenreOption {
  /** Value sent to the API as ?q= */
  name: string
  /** Label shown in the UI */
  label: string
  movie: boolean
  tv: boolean
}

export const GENRES: GenreOption[] = [
  { name: 'Action', label: 'Action', movie: true, tv: true },
  { name: 'Adventure', label: 'Adventure', movie: true, tv: true },
  { name: 'Animation', label: 'Animation', movie: true, tv: true },
  { name: 'Comedy', label: 'Comedy', movie: true, tv: true },
  { name: 'Crime', label: 'Crime', movie: true, tv: true },
  { name: 'Documentary', label: 'Documentary', movie: true, tv: true },
  { name: 'Drama', label: 'Drama', movie: true, tv: true },
  { name: 'Family', label: 'Family', movie: true, tv: true },
  { name: 'Fantasy', label: 'Fantasy', movie: true, tv: true },
  { name: 'History', label: 'History', movie: true, tv: false },
  { name: 'Horror', label: 'Horror', movie: true, tv: false },
  { name: 'Music', label: 'Music', movie: true, tv: false },
  { name: 'Mystery', label: 'Mystery', movie: true, tv: true },
  { name: 'Romance', label: 'Romance', movie: true, tv: false },
  { name: 'Science Fiction', label: 'Sci-Fi', movie: true, tv: true },
  { name: 'Thriller', label: 'Thriller', movie: true, tv: false },
  { name: 'War', label: 'War', movie: true, tv: true },
  { name: 'Western', label: 'Western', movie: true, tv: true },
  { name: 'Kids', label: 'Kids', movie: false, tv: true },
  { name: 'Reality', label: 'Reality', movie: false, tv: true },
]

/** Always-affirmative verdicts — the ball has decided, so we lean positive. */
export const VERDICTS: string[] = [
  'It is decided.',
  'Signs point to yes.',
  'Without a doubt.',
  'The stars align.',
  'You may rely on it.',
  'Most likely…',
  'As I see it, yes.',
  'Outlook excellent.',
  'It is certain.',
  'Tonight is the night.',
]

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Which media types a draw should query, honoring genre support for "both". */
export function resolveTypes(filters: RecFilters): MediaType[] {
  const wanted: MediaType[] =
    filters.mediaType === 'both' ? ['movie', 'tv'] : [filters.mediaType]
  if (!filters.genre) return wanted
  const g = GENRES.find((x) => x.name === filters.genre)
  if (!g) return wanted
  return wanted.filter((t) => (t === 'movie' ? g.movie : g.tv))
}

/** Genres valid for the current media-type filter (for the dropdown). */
export function genresFor(mediaType: MediaFilter): GenreOption[] {
  if (mediaType === 'movie') return GENRES.filter((g) => g.movie)
  if (mediaType === 'tv') return GENRES.filter((g) => g.tv)
  return GENRES.filter((g) => g.movie && g.tv)
}

// ─── Draw logic ───────────────────────────────────────────────────────────

// A page far enough back to keep re-rolls varied, but shallow enough to stay
// among titles people have actually heard of.
const MAX_PAGE = 8

interface RawSummary {
  id: number
  title?: string
  name?: string
  overview?: string
  releaseDate?: string
  firstAirDate?: string
  posterUrl?: string | null
  voteAverage?: number
}

function fetchPage(
  type: MediaType,
  genre: string | null,
  page: number
): Promise<{ results: RawSummary[] }> {
  if (genre) {
    return type === 'movie' ? searchMovieByGenre(genre, page) : searchTVByGenre(genre, page)
  }
  return type === 'movie' ? getPopularMovies(page) : getPopularTV(page)
}

function normalize(type: MediaType, raw: RawSummary): RecItem | null {
  const title = type === 'movie' ? raw.title : raw.name
  const date = type === 'movie' ? raw.releaseDate : raw.firstAirDate
  if (!title) return null
  return {
    id: raw.id,
    type,
    title,
    year: date ? date.slice(0, 4) : '',
    posterUrl: raw.posterUrl ?? null,
    overview: raw.overview ?? '',
    voteAverage: raw.voteAverage ?? 0,
    verdict: '',
  }
}

async function gather(
  types: MediaType[],
  genre: string | null,
  page: number
): Promise<RecItem[]> {
  const settled = await Promise.allSettled(
    types.map((t) => fetchPage(t, genre, page).then((res) => ({ type: t, res })))
  )
  const out: RecItem[] = []
  for (const s of settled) {
    if (s.status !== 'fulfilled') continue
    for (const raw of s.value.res.results ?? []) {
      const item = normalize(s.value.type, raw)
      // Only surface titles with a poster so the reveal card always looks right.
      if (item && item.posterUrl) out.push(item)
    }
  }
  return out
}

export type DrawResult =
  | { ok: true; item: RecItem }
  | { ok: false; error: string }

export async function drawRecommendation(filters: RecFilters): Promise<DrawResult> {
  const types = resolveTypes(filters)
  if (types.length === 0) {
    return { ok: false, error: 'That genre isn’t available for the selected type.' }
  }

  try {
    const page = 1 + Math.floor(Math.random() * MAX_PAGE)
    let candidates = await gather(types, filters.genre, page)
    // A random genre page may land out of range — one retry on page 1.
    if (candidates.length === 0) {
      candidates = await gather(types, filters.genre, 1)
    }
    if (candidates.length === 0) {
      return { ok: false, error: 'Nothing surfaced for that combo. Try another vibe.' }
    }
    const chosen = pick(candidates)
    return { ok: true, item: { ...chosen, verdict: pick(VERDICTS) } }
  } catch {
    return { ok: false, error: 'The 8-ball is cloudy right now — try again.' }
  }
}