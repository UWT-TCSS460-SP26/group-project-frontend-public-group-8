# Recommendation System — Backend Requirements

## What is currently available

| Data | Source | Notes |
|------|--------|-------|
| Popular movies/TV | `GET /v1/movies/popular`, `GET /v1/tv/popular` | Sorted by external popularity score |
| Community top-rated | `GET /v1/community/top-rated` | All media types, aggregated avg rating + count |
| User's ratings | `GET /v1/users/me/ratings` | Paginated; includes `media_type` and `title_id` |
| User's reviews | `GET /v1/users/me/reviews` | Paginated; includes `title_id` |
| Media metadata | `GET /v1/media/{type}/{id}` | Includes `genre` string |
| TV genre search | `GET /v1/tv/search/genre?q={genre}` | Genre-based TV results |

## What is missing

1. **No genre-based movie search** — `/v1/movie/search/genre` does not exist. Genre filtering only works for TV.
2. **No genre field on popular/search results** — `MovieSummary` and `TVSummary` lack genre data; only `EnrichedMediaMetadata` (from `/v1/media/{type}/{id}`) has a genre string.
3. **No user preference profile** — The backend stores raw ratings but does not compute genre affinity, watch history, or preference vectors.
4. **No recommendation endpoint** — There is no `/v1/recommendations` or similar.
5. **No "because you rated X" relationship** — No similarity or collaborative filtering.

## Practical minimum viable recommendation approach

A lightweight frontend-only fallback is possible with the current API but is limited to:

> "You gave high ratings to some titles — here are more titles with the same genre."

**Steps:**
1. Fetch the first page of `GET /v1/users/me/ratings`.
2. For each highly-rated item (≥4 stars), fetch `GET /v1/media/{type}/{id}` to get the genre string.
3. For TV titles, call `GET /v1/tv/search/genre?q={genre}` to get similar shows.
4. Filter out titles the user has already rated; display the remainder as "You Might Like".

**Limitations:** Requires `N` extra fetches (one per highly-rated title). No movie genre search. Genre strings are free-text (e.g., "Action, Adventure"), requiring client-side parsing. No collaborative signal — same genre ≠ personal taste.

## Ideal backend endpoint shape

```
GET /v1/recommendations?userId={id}&limit=20
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "title_id": number,
      "media_type": "movie" | "tv",
      "reason": "Because you liked Inception",
      "metadata": EnrichedMediaMetadata
    }
  ]
}
```

Alternatively a simpler content-based endpoint:

```
GET /v1/titles/{type}/{id}/similar?limit=10
(no auth required)
```

## Frontend files that would consume it

| File | Change needed |
|------|--------------|
| `lib/api.ts` | Add `getRecommendations(token)` and/or `getSimilar(type, id)` helpers |
| `app/page.tsx` | Add `<RecommendedForYou />` section below `RecentActivity` (authenticated only) |
| `components/RecommendedForYou.tsx` | New client component — HoverCarousel of recommendation cards with reason label |
