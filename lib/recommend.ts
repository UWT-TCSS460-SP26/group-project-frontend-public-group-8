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

// 100 affirmative Magic 8-Ball fortunes, each weaving in the picked title
// ({title} is substituted at draw time). We only use the positive register —
// the ball is always handing back a real recommendation, so a "no" would
// contradict it. The big pool + shuffle-bag picker (below) keeps every reveal
// feeling personal and fresh.
export const VERDICTS: string[] = [
  'Fate has chosen {title}.',
  'The stars insist on {title}.',
  'Destiny whispers {title}.',
  'The universe nudges you toward {title}.',
  'The cards say {title}.',
  'The omens favor {title}.',
  'The cosmos points to {title}.',
  'The spirits suggest {title}.',
  'The crystal shows {title}.',
  'The fates align on {title}.',
  'The night favors {title}.',
  'The ball has spoken for {title}.',
  'The mists clear to reveal {title}.',
  'The signs all point to {title}.',
  'The vision reveals {title}.',
  'The 8-ball is sure about {title}.',
  'The answer glows clear for {title}.',
  'The future belongs to {title}.',
  'The ball never lies about {title}.',
  'The ball glows for {title}.',
  '{title} is the one.',
  '{title} is your destiny tonight.',
  '{title} is written in the stars.',
  '{title} is exactly right.',
  '{title} is what the night needs.',
  '{title} is the perfect pick.',
  '{title} is your lucky choice.',
  '{title} is meant to be.',
  '{title} is your sign.',
  '{title} is the move.',
  '{title} is in your cards.',
  '{title} is your fortune.',
  '{title} is your perfect match.',
  '{title} is the right call.',
  '{title} is waiting just for you.',
  '{title} was meant for you.',
  '{title} is calling your name.',
  '{title} will not let you down.',
  '{title} feels like home tonight.',
  '{title} hums with promise.',
  '{title} is your tonight.',
  '{title} is the chosen one tonight.',
  '{title} was always the answer.',
  '{title} is calling the shots tonight.',
  '{title} is your happy ending.',
  '{title} is the lucky one tonight.',
  '{title} is your kind of magic.',
  '{title} is your fate tonight.',
  '{title} is the obvious choice.',
  '{title} is calling you in.',
  'Press play on {title}.',
  'Surrender to {title}.',
  'Go with {title} tonight.',
  'Reach for {title}.',
  'Embrace {title}.',
  'Say yes to {title}.',
  'Settle in with {title}.',
  'Lean into {title}.',
  'Give in to {title}.',
  'Make tonight {title}.',
  'Dim the lights for {title}.',
  'Believe in {title}.',
  'Trust {title} tonight.',
  'Choose {title} and never look back.',
  'Look no further than {title}.',
  'Pour a drink and queue {title}.',
  'Cozy up with {title}.',
  'Surrender the remote to {title}.',
  'Cancel your plans for {title}.',
  'Lose yourself in {title}.',
  'Clear your evening for {title}.',
  'Let {title} take the night.',
  'Trust the ball and watch {title}.',
  'Hold out for {title}.',
  'Bet the night on {title}.',
  'Without a doubt, it is {title}.',
  'Yes, definitely {title}.',
  'You may rely on {title}.',
  'As I see it, {title}.',
  'Most likely, {title}.',
  'Outlook is good for {title}.',
  'Signs point to {title}.',
  'You can count on {title}.',
  'It is decidedly {title}.',
  'Beyond a doubt, {title}.',
  'Count on {title} tonight.',
  'Certain as ever, {title}.',
  'Tonight it must be {title}.',
  'All roads lead to {title}.',
  'Your answer is {title}.',
  'Yes, a thousand times {title}.',
  'Tonight belongs to {title}.',
  'Your evening wants {title}.',
  'Your future holds {title}.',
  'Your gut already knows {title}.',
  'Lucky you, it is {title}.',
  'Tonight rewards you with {title}.',
  'Trust me, it is {title}.',
  'Destiny approves of {title}.',
  'Tonight your fortune is {title}.',
]

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Shuffle-bag picker: hand out every verdict once (in random order) before any
// repeats, and never start a fresh bag with the phrase the previous bag ended
// on. This makes any given phrase recur only rarely.
let verdictBag: string[] = []
let lastVerdict: string | null = null

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function nextVerdict(title: string): string {
  if (verdictBag.length === 0) {
    verdictBag = shuffle(VERDICTS)
    // Avoid an immediate repeat across bag boundaries.
    if (verdictBag[verdictBag.length - 1] === lastVerdict && verdictBag.length > 1) {
      ;[verdictBag[0], verdictBag[verdictBag.length - 1]] = [
        verdictBag[verdictBag.length - 1],
        verdictBag[0],
      ]
    }
  }
  lastVerdict = verdictBag.pop()!
  return lastVerdict.replace('{title}', title)
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
    return { ok: true, item: { ...chosen, verdict: nextVerdict(chosen.title) } }
  } catch {
    return { ok: false, error: 'The 8-ball is cloudy right now — try again.' }
  }
}