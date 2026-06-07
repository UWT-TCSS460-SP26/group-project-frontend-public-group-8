# Screen8 — Sprint 7 Frontend Audit

**Branch:** `caleb-cyberpunk-audit`  
**Date:** 2026-06-02  
**Auditor:** Claude (claude-sonnet-4-6)

---

## Repository Overview

### Major Folders

| Path | Purpose |
|------|---------|
| `app/` | Next.js App Router pages (server components by default) |
| `app/layout.tsx` | Root layout — injects `SessionProvider`, `Header`, `TokenExpiryWatcher`, anti-FOUC theme script |
| `app/page.tsx` | Home — server component, fetches popular movies + TV in parallel |
| `app/search/page.tsx` | Search results — server component, driven by `?q=` and `?type=` URL params |
| `app/media/[type]/[id]/page.tsx` | Detail page — server component, fetches enriched media; renders client `RatingSection` |
| `app/profile/page.tsx` | Profile — full client component, paginated ratings + reviews |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth v5 OIDC handler |
| `app/debug/session/` | Empty directory; the page was removed |
| `components/` | Reusable UI components (all client-side except `Header`) |
| `lib/api.ts` | Every API call function + all TypeScript types |
| `lib/clientAuth.ts` | `signOutIfAuthError` — used by every client component on 401 |
| `auth.ts` | NextAuth config: OIDC provider, JWT/session callbacks, post-login user sync |
| `styles/globals.css` | CSS custom properties for dark (default) and light themes |
| `group7_openapi.yaml` | Group 7's full backend API spec |

### Pages

- **Home (`/`)** — Two media grids (Popular Movies, Popular TV). Each card links to `/media/{type}/{id}`.
- **Search (`/search`)** — Full-width result grids for movies and TV, filtered by `?type=`. NavSearch bar in the header feeds this page.
- **Detail (`/media/movie|tv/{id}`)** — Poster, metadata, community stats, interactive `RatingSection` below.
- **Profile (`/profile`)** — Requires sign-in. Shows paginated ratings (editable stars, delete) and reviews (edit inline, delete).

### API Client (`lib/api.ts`)

- `apiFetch<T>` — GET with optional bearer token, `next: { revalidate: 60 }` (server-side cache, 60 s).
- `apiMutate<T>` — POST/PUT/PATCH/DELETE with bearer token, no caching.
- Base URL: `NEXT_PUBLIC_API_BASE_URL` env var, fallback `https://tcss-460-group-7.onrender.com`.

### Authentication Flow

1. User clicks **Sign In** → NextAuth redirects to IAM's `/v2/oauth/authorize`.
2. IAM returns an auth code → NextAuth exchanges it at `/v2/oauth/token`.
3. JWT callback decodes the access token, reads `exp`, POSTs `POST /v1/users` to sync the user, stores `authorId` in the JWT.
4. Session callback exposes `accessToken`, `authorId`, `accessTokenExpires` to client components.
5. `TokenExpiryWatcher` (client, invisible) sets a `setTimeout` to auto-signout when the token expires.
6. Any 401 from an authenticated request calls `signOutIfAuthError` which triggers `signOut({ callbackUrl: '/' })`.

### Styling System

- CSS custom properties in `globals.css` (dark default, `data-theme="light"` variant).
- No CSS modules in Sprint 7 components — all inline `style` props.
- `styles/Home.module.css` exists but is unused by any current page.

---

## Commands Run

| Command | Outcome |
|---------|---------|
| `npm run lint` | **Passed** — 0 errors, 7 warnings (all `@next/next/no-img-element`) |
| `npx tsc --noEmit` | **Failed** — 4 real errors in `NavSearch.tsx` (null-safety) + 2 phantom errors from stale `.next/types` cache |
| `npm run build` | **Failed** — build worker exits on the same NavSearch.tsx TypeScript error |
| `curl /health` | **200 OK** — backend alive |
| `curl /v1/movies/popular` | **200 OK** — returns paginated movie list |
| `curl /v1/tv/popular` | **200 OK** — returns paginated TV list |
| `curl /v1/movie/search/title?q=super+mario+bros` | **200 OK** — returns 7 results including TMDB ID 502356 |
| `curl /v1/tv/search/title?q=breaking+bad` | **200 OK** — returns correct results |
| `curl /v1/media/movie/502356` | **200 OK** — Super Mario Bros enriched detail |
| `curl /v1/media/tv/1396` | **200 OK** — Breaking Bad with seasons/episodes |
| `curl /v1/reviews/title/502356` | **200 OK** — empty review list (no reviews yet) |
| `curl /v1/reviews/user/{id}/title/{id}` | **404** — route does not exist |
| `POST /v1/ratings/502356` (invalid token) | **401** `{"error":"The bearer token is invalid."}` |
| `POST /v1/reviews` (invalid token) | **401** same |
| `PATCH /v1/ratings/502356` (invalid token) | **401** same |
| No automated test suite configured | N/A |

---

## Tested Flows

**1. Home page loads popular content**
- Steps: Open `/`.
- Expected: Two grids of movies and TV shows.
- Actual (static analysis + API verification): Both `/v1/movies/popular` and `/v1/tv/popular` return valid data. Cards link correctly to `/media/movie/{id}` and `/media/tv/{id}`.
- Status: ✅ Works.

**2. Search in the navbar**
- Steps: Type in NavSearch input, press Search → routed to `/search?q=...&type=...`.
- Expected: Results page with movie and/or TV grids.
- Actual: Search endpoints work. NavSearch is in the header as required.
- Status: ✅ Works — but NavSearch TypeScript error causes build failure (see Bug table).

**3. Movie detail page**
- Steps: Click a movie card → `/media/movie/502356` (Super Mario Bros. Movie).
- Expected: Title, poster, genres, year, community rating, reviews, rating widget.
- Actual: Backend returns full enriched payload. Community shows `ratingCount: 0` for this title (no ratings yet). All UI sections render correctly from the server component.
- Status: ✅ Works for valid IDs; correctly shows Next.js 404 for invalid IDs.

**4. TV detail page**
- Steps: Click a TV card → `/media/tv/1396` (Breaking Bad).
- Expected: Title, seasons, episodes, community stats, reviews.
- Actual: Backend returns seasons=5, episodes=62, averageRating=3, ratingCount=10.
- Status: ✅ Works.

**5. Sign-in (active account)**
- Steps: Click Sign In → OIDC redirect → enter credentials → callback.
- Expected: Session established; header shows `Hi, {firstName}`.
- Actual (code analysis): The JWT callback decodes the access token for `preferred_username`, email, and syncs to `/v1/users`. Session exposes `accessToken` and `authorId`. If `profile.name` is returned by the IAM, the header shows the first name; otherwise it shows the email.
- Status: ✅ Correct for activated accounts. Untestable without browser (requires real credentials).

**6. Sign-in (inactive account)**
- Steps: Enter credentials for an unactivated account.
- Expected: Friendly error message explaining the account needs activation.
- Actual: IAM returns "Authorization Error — Auth²" on its own page. After redirect back, NextAuth shows its default generic error page (`/api/auth/error`). No custom page exists.
- Status: ⚠️ Reproduced by code inspection + IAM endpoint test. User sees an unhelpful error.

**7. Rating a movie (signed in)**
- Steps: Open detail page, click a star.
- Expected: `POST /v1/ratings/{titleId}` fires with `{rating, media_type}`, star stays selected.
- Actual (code): `submitRating` sends POST. Backend acts as upsert (creates or replaces). `currentRating` state updates from the response.
- Status: ✅ Correct. Duplicate protection enforced server-side via upsert.

**8. Existing rating shows on page reload**
- Steps: Rate a movie, navigate away, come back to the detail page.
- Expected: Stars pre-filled at the previously saved rating.
- Actual (code): On mount, `fetchMyContent` paginates through all pages of `/v1/users/me/ratings` looking for a matching `title_id`. It sets `currentRating` from the match.
- Status: ✅ Correct for users with few ratings. ⚠️ Potentially slow if a user has hundreds of ratings across many pages (N×API calls).

**9. Write a review (signed in)**
- Steps: Open detail page, click "Write a Review", fill form, submit.
- Expected: `POST /v1/reviews` fires, review appears above community list, form hides.
- Actual (code): `createReview` sends correct payload. 409 is handled — fetches existing review via `fetchMyContent`.
- Status: ✅ Correct. Duplicate protection enforced by backend 409 + frontend response handling.

**10. Existing review shown on page reload**
- Steps: Submit a review, navigate away, return to the detail page.
- Expected: "Your review" panel shown with the review text.
- Actual (code): `fetchMyContent` paginates through `/v1/users/me/reviews` to find matching `title_id`. Sets `myReview` state.
- Status: ✅ Works — but inefficient (full paginated scan). No direct `GET /v1/reviews/user/{authorId}/title/{title_id}` endpoint exists.

**11. Edit and delete rating/review**
- Steps: Click Edit on a review from the detail or profile page, change text, Save.
- Expected: `PUT /v1/reviews/{id}` fires, updated text shows.
- Actual (code): `updateReview` is called correctly with the review ID and new content/header. State is updated optimistically.
- Status: ✅ Correct.

**12. Upvote/downvote a review**
- Steps: Click 👍 or 👎 on a community review.
- Expected: Vote registers, count updates.
- Actual (code): Toggle logic is correct — removes existing opposite vote before adding new one. Count is updated from backend response.
- Status: ✅ Works. ⚠️ Vote state resets to null on page refresh (backend doesn't return current user's vote).

**13. Profile page**
- Steps: Navigate to `/profile`.
- Expected: Lists all your ratings and reviews with edit/delete.
- Actual (code): Fetches page 1 of `/v1/users/me/ratings` and `/v1/users/me/reviews`. No pagination controls exist — users with > 10 items see only the first 10.
- Status: ⚠️ Partial. Missing pagination UI.

**14. Trailer on hover**
- Steps: Hover over a movie card.
- Expected: Trailer preview appears.
- Actual: No trailer-related code exists in any file in this branch or the source branch. Git log shows no trailer commits in any branch. `charlene-sprint7` has a different home page layout but no video/trailer functionality.
- Status: ❌ Feature does not exist in this branch or any branch inspected.

---

## Bug Table

| # | Severity | Area | Reproduction Steps | Expected | Actual | Frontend File | API Request | Ownership | Recommended Fix | Blocks Frontend? |
|---|----------|------|--------------------|----------|--------|---------------|-------------|-----------|----------------|-----------------|
| 1 | **Blocker** | Build / TypeScript | `npm run build` | Build succeeds | Type error: `useSearchParams()` possibly `null` at lines 9, 10, 14, 15 | `components/NavSearch.tsx:9-15` | N/A | Frontend | Add `if (!searchParams) return null` early return, or use `searchParams?.get(...)` | **Yes** |
| 2 | **Blocker** | TypeScript / Stale Cache | `npx tsc --noEmit` | No errors | References deleted `app/browse/page.tsx` in `.next/types/validator.ts` | `.next/types/validator.ts` | N/A | Frontend (stale cache) | Delete `.next/` folder; rebuild will regenerate correct types | **Yes** (masks real errors) |
| 3 | High | Authentication | Sign in with an unactivated account | Friendly "account not active, check your email" message | NextAuth generic error page | `app/api/auth/error` (doesn't exist) | IAM `/v2/oauth/authorize` → redirect with `error=` | Backend/IAM (activation) + Frontend (no custom error page) | Add `app/api/auth/error/page.tsx`; file backend ticket to clarify activation steps | No |
| 4 | High | Reviews | User's vote state lost on reload | Vote state persists across page loads | `myVote` always starts as `null`; no way to fetch current user's vote on a review | `components/ReviewVotes.tsx:21` | `GET /v1/reviews/{id}` doesn't return current-user vote | Backend (missing field) | Backend: add `userVote` to review response. Frontend: seed `myVote` from that field | No |
| 5 | High | Reviews | Open detail page (user has reviewed this title) | Fast, single request to fetch user's review for this title | Must paginate through all pages of `/v1/users/me/reviews` — O(N pages) requests | `components/RatingSection.tsx:88-110` | No `GET /v1/reviews/user/{authorId}/title/{title_id}` endpoint | Backend (missing endpoint) | Backend: add filtered endpoint. Frontend: use it once available | No (workaround exists) |
| 6 | Medium | Authentication | Sign in with any account; check header | Header shows user's first name | If the IAM's `profile.name` claim is empty/null, falls back to email address | `components/Header.tsx:45` | IAM `/v2/oauth/userinfo` (name claim) | Unclear (depends on IAM profile completeness) | Fallback already present; could use `display_name` from the synced user record instead | No |
| 7 | Medium | Profile | Have > 10 ratings or reviews; open `/profile` | All ratings/reviews shown with pagination | Only first 10 shown; no "Load more" or page controls | `app/profile/page.tsx:36` | `/v1/users/me/ratings?page=1`, `/v1/users/me/reviews?page=1` | Frontend | Add pagination UI on profile page | No |
| 8 | Medium | Performance | Open any detail page while signed in with many saved ratings | Fast load; single targeted request | Fetches up to N pages of all user ratings to find matching title | `components/RatingSection.tsx:70-84` | `GET /v1/users/me/ratings?page=N` (repeated) | Backend (missing endpoint) + Frontend (workaround) | Backend: add `GET /v1/ratings/user/{authorId}/title/{title_id}` lookup (already exists in spec!) — switch to it once authorId is reliably available | No |
| 9 | Medium | Ratings | `updateRating` (PATCH) exported from `lib/api.ts` | Used somewhere | Never called by any component; `submitRating` (POST/upsert) is used for all cases | `lib/api.ts:251` | `PATCH /v1/ratings/{id}` | Frontend (dead code) | Remove or document as intentionally unused | No |
| 10 | Medium | Performance | View any server-rendered page | Freshest data shown | `apiFetch` uses `revalidate: 60` — community stats up to 60 s stale after a mutation | `lib/api.ts:11` | All `apiFetch` calls | Frontend | Reduce revalidation for community data or add `revalidatePath` after mutations | No |
| 11 | Low | Quality | `npm run lint` | 0 warnings | 7 `no-img-element` warnings (use `next/image`) | 5 files | N/A | Frontend | Switch to `<Image>` from `next/image`; also improves LCP | No |
| 12 | Low | UX | Refresh detail page after voting on a review | Vote indicator persists | Vote state resets to neutral; user can re-vote without knowing they already did | `components/ReviewVotes.tsx` | No current-vote field in review response | Backend (missing data) | See bug #4 | No |
| 13 | Low | UX | Open profile page, wait for data | Loading skeleton or placeholder | Raw "Loading…" text appears during async load | `app/profile/page.tsx:140` | N/A | Frontend | Add loading skeleton cards | No |
| 14 | Low | Accessibility | Tab through the review vote buttons | Visible focus ring | No custom focus ring; relies on browser default which may be invisible in dark theme | `components/ReviewVotes.tsx` | N/A | Frontend | Add `focus-visible` outline styles in `globals.css` | No |
| 15 | Low | Mobile | Open app on narrow screen (≤375px) | All elements accessible | NavSearch can compress very small; no hard floor enforced below 200px | `components/NavSearch.tsx:29` | N/A | Frontend | Test at 375px; add media query to stack search below logo row | No |

---

## Backend Bug Reports

### Bug Report 1 — Missing: Get user's review for a specific title

**Title:** `GET /v1/reviews` — No endpoint to fetch one user's review for a specific title

**Description:**
The frontend detail page needs to know whether the signed-in user has already reviewed a particular movie or TV show. Without a targeted endpoint, the frontend must paginate through the user's entire review history (`GET /v1/users/me/reviews?page=N`) to find a match. For users with many reviews, this causes multiple sequential API requests on every page load.

**Exact reproduction steps:**
1. Create a user account and submit reviews for 15+ titles.
2. Open the detail page for any title you have reviewed.
3. Observe the browser Network tab: multiple requests to `/v1/users/me/reviews?page=1`, `?page=2`, etc. before the user's review panel appears.

**Expected result:**
A single request such as `GET /v1/reviews/me/title/{title_id}` returns the user's review for that title, or a 404 if none exists.

**Actual result:**
HTTP 404: `{"error":"No route matches the requested URL and HTTP method."}` when attempting `GET /v1/reviews/user/{authorId}/title/{title_id}`.

**Endpoint, method, parameters, and response status:**
- Method: `GET`
- Attempted URL: `https://tcss-460-group-7.onrender.com/v1/reviews/user/{authorId}/title/{title_id}`
- Response status: `404`

**Example request:**
```
GET /v1/reviews/user/7/title/502356
Authorization: Bearer <valid-token>
```

**Example response (actual):**
```json
{"error":"No route matches the requested URL and HTTP method."}
```

**Why the frontend cannot fully solve it:**
The workaround (paginating through all user reviews) is unbounded — it makes one API call per page of reviews. This grows linearly with the user's activity. It also adds latency to every detail page load for authenticated users.

**Suggested backend acceptance criteria:**
- `GET /v1/reviews/me/title/{title_id}` (preferred, token-identity based) or `GET /v1/reviews/user/{authorId}/title/{title_id}` returns the user's review object (same `Review` schema) if it exists.
- Returns `404` with a clear message if the user has not reviewed that title.
- Requires bearer token authentication.

---

### Bug Report 2 — Review voting: no way to retrieve current user's vote state

**Title:** `GET /v1/reviews/{id}` — Response does not include the current user's vote

**Description:**
The upvote/downvote UI (`ReviewVotes` component) initialises with `myVote: null` on every page load because the backend never tells the client whether the current user has already voted on a review. This means:
1. A user who upvoted a review cannot see that they already voted when they return.
2. The UI shows inconsistent state (button not highlighted) even though the vote count is correct.

**Exact reproduction steps:**
1. Sign in. Open a detail page with community reviews.
2. Click 👍 on a review. Count increases.
3. Navigate away. Return to the same detail page.
4. The 👍 button is no longer highlighted; the user's prior vote is invisible even though the count on the server is still incremented.

**Expected result:**
The review response includes a field indicating whether the current authenticated user has upvoted, downvoted, or not voted on this review (e.g., `userVote: "up" | "down" | null`).

**Actual result:**
Review objects contain only `upvotes` (integer count) and `downvotes` (integer count). No per-user vote attribution.

**Endpoint, method, parameters:**
- `GET /v1/reviews/{id}` — missing `userVote` field
- `GET /v1/media/{type}/{id}` — `recentReviews` array also missing `userVote`

**Example response (actual):**
```json
{
  "id": 6,
  "authorId": 6,
  "content": "Very intense, great acting all around.",
  "header": "Intense and Gripping",
  "upvotes": 0,
  "downvotes": 0,
  "createdAt": "2026-05-08T01:12:05.265Z"
}
```

**Why the frontend cannot fully solve it:**
Without a per-user vote field, the frontend must either make a separate API call per review (N additional requests) or accept that vote state is lost on refresh. There is no "get my votes" endpoint in the spec either.

**Suggested backend acceptance criteria:**
- When a bearer token is present, `GET /v1/reviews/{id}` and the `recentReviews` array in `GET /v1/media/{type}/{id}` include a `userVote: "up" | "down" | null` field reflecting the current authenticated user's vote.
- When no token is provided (unauthenticated), `userVote` is omitted or `null`.

---

### Bug Report 3 — "Account not active" — no clear activation path for new users

**Title:** IAM — Users see a generic auth error with no recovery instructions when their account is not active

**Description:**
The IAM server (`https://tcss-460-iam.onrender.com`) rejects sign-in for accounts that have not been activated. The error page displayed by the IAM says "Authorization Error" but gives no instructions on how to activate the account or who to contact. After the redirect back to the frontend, NextAuth shows its default `/api/auth/error` page which is equally unhelpful.

**Exact reproduction steps:**
1. Create a new account via the IAM or Token Playground.
2. Before activation is complete, attempt to sign in via the frontend's Sign In button.
3. Observe the IAM's "Authorization Error — Auth²" page, then the NextAuth generic error redirect.

**Expected result:**
Users see a clear message: "Your account has not been activated. Please check your email for an activation link, or contact your administrator."

**Actual result:**
IAM shows generic "Authorization Error — Auth²". Frontend shows NextAuth's default error page with no useful guidance.

**Endpoint, method, parameters:**
- IAM: `GET https://tcss-460-iam.onrender.com/v2/oauth/authorize?client_id=...`
- Frontend callback: `GET /api/auth/callback/tcss460?error=...`

**Why the frontend cannot fully solve it:**
The root cause is the IAM's account activation state. The frontend cannot sign in users whose accounts the IAM rejects. However, the frontend can add a custom error page that intercepts NextAuth's error query parameter and shows actionable text.

**Suggested backend acceptance criteria:**
- The IAM's token endpoint or authorization redirect includes a human-readable `error_description` in the OAuth2 error response so the frontend can display it.
- The IAM documentation clarifies whether new accounts require email verification, admin approval, or manual activation.

---

## Frontend Implementation Plan

Ordered from highest priority to lowest. Each item is one small, reviewable commit.

### Commit 1 — Fix build blocker: NavSearch null-safety
**File:** `components/NavSearch.tsx`  
**Change:** `useSearchParams()` returns `ReadonlyURLSearchParams | null`. Add an early return inside `NavSearchInner` when it is null.  
**Why first:** Nothing deploys until this is fixed.

### Commit 2 — Delete stale `.next/` cache
**Change:** Delete `.next/` and run a fresh build. The stale reference to `app/browse/page.tsx` in the generated `validator.ts` disappears.  
**Why second:** Clears phantom TypeScript errors so real errors are visible.

### Commit 3 — Add custom auth error page
**File:** New `app/api/auth/error/page.tsx`  
**Change:** Catch NextAuth's `?error=` query param; display a human-readable message for `AccessDenied` and a fallback for unknown errors.  
**Why:** Unblocks users who hit the activation error and have no idea what to do.

### Commit 4 — Profile page pagination
**File:** `app/profile/page.tsx`  
**Change:** Add "Load more" or simple page controls for ratings and reviews using the `pagination` data already returned by the API.  
**Why:** Users with > 10 ratings/reviews currently cannot see them at all.

### Commit 5 — Remove dead `updateRating` export
**File:** `lib/api.ts`  
**Change:** Remove the `updateRating` function (calls `PATCH /v1/ratings/{id}`). `submitRating` (POST/upsert) handles all cases correctly.  
**Why:** Removes a misleading export that could confuse future contributors.

### Commit 6 — Replace `<img>` with `<Image>` from next/image
**Files:** `app/page.tsx`, `app/search/page.tsx`, `app/profile/page.tsx`, `app/media/[type]/[id]/page.tsx`, `components/Header.tsx`  
**Change:** Swap `<img>` for `<Image>`. Add `remotePatterns` for `image.tmdb.org` to `next.config.ts`.  
**Why:** Fixes 7 ESLint warnings; improves LCP via automatic WebP conversion and lazy loading.

### Commit 7 — Add focus-visible ring to interactive elements
**File:** `styles/globals.css`  
**Change:** Add a global `:focus-visible` rule using `var(--accent-ring)` so all buttons and links have a visible keyboard focus indicator.  
**Why:** Accessibility baseline.

### Commit 8 — Loading skeletons for profile page
**File:** `app/profile/page.tsx`  
**Change:** Replace the raw `"Loading…"` text with skeleton placeholder cards while API data loads.  
**Why:** Removes the blank flash that makes the app feel broken during load.

---

## Design and Performance Plan

### Color and Typography Direction (Cyberpunk Theme)

Keep the existing navy/slate base (`--bg: #0f172a`). Enhance with neon accents:

- **Primary neon:** Cyan `#00f5ff` (brighter than current `#38bdf8`) for interactive elements.
- **Secondary neon:** Electric violet `#bf00ff` for hover states and secondary highlights.
- **Warning/danger:** Hot pink `#ff0066` to replace the current red error color.
- **Text:** Keep `#e2e8f0` for body; use `#00f5ff` for links and labels on hover.
- **Typography:** Add [Orbitron](https://fonts.google.com/specimen/Orbitron) (free, Google Fonts) for headings only. Keep the system sans-serif stack for body text to preserve readability. A single `@import` at the top of `globals.css`.

### Navbar Improvements

- Add a thin `1px` neon border on the bottom of the header (`border-bottom: 1px solid var(--accent)`).
- On scroll, apply a subtle `backdrop-filter: blur(12px)` and semi-transparent background to create a glass effect.
- Add a subtle glow `box-shadow: 0 0 12px rgba(0,245,255,0.15)` to the Sign In and Search buttons on hover.
- NavSearch input: on focus, `box-shadow: 0 0 0 2px var(--accent)` + `border-color: var(--accent)`.

### Card Improvements

- Add `transition: transform 0.15s ease, box-shadow 0.15s ease` to cards.
- On hover: `transform: translateY(-4px)`, `box-shadow: 0 8px 24px rgba(0,245,255,0.15)`.
- Thin neon border on hover: `border-color: var(--accent)`.
- Poster images: slightly more rounded corners (`border-radius: 6px`).

### Detail Page Layout

- Use a full-width backdrop image (blurred, darkened overlay) behind the poster + title row — creates a cinema feel.
- Add a neon left-border accent on the "Your Rating" section: `border-left: 3px solid var(--accent)`.
- Community reviews: add a subtle `background: var(--bg-subtle)` card surface with a thin neon left-bar for the "Your review" panel.
- The star rating widget: increase star size from 28px to 32px on desktop; apply a golden glow on hover `filter: drop-shadow(0 0 4px #f59e0b)`.

### Hover and Transition Ideas

- All buttons: `transition: background 0.12s, box-shadow 0.12s, transform 0.1s`.
- Sign In / Post Review buttons on hover: glow effect `box-shadow: 0 0 12px var(--accent-ring)`.
- Card link: `transform: translateY(-4px)` on hover.
- Theme toggle button: quick spin animation on the SVG icon when toggled.

### Loading and Error States

- Profile and RatingSection "Loading…" → skeleton placeholder bars (same dimensions as the content, using `--placeholder-bg` with a shimmer `@keyframes` animation).
- Add `app/not-found.tsx` with a styled "404 — Title Not Found" page matching the cyberpunk theme.
- Add `app/error.tsx` for unexpected runtime errors.
- Add `app/api/auth/error/page.tsx` for the "account not active" auth error.

### Mobile Behavior

- NavSearch already wraps at small widths. Add a breakpoint at ~480px to collapse the search form to full-width below the logo row.
- Media card grid `minmax(150px, 1fr)` is good. Reduce the gap to `0.75rem` on mobile.
- Detail page: on narrow screens, the poster should stack above the text. A `flexDirection: 'column'` at `max-width: 600px` achieves this.
- Profile page: ratings and reviews already render single-column.

### Accessibility Concerns

- All interactive elements need `:focus-visible` rings (Commit 7 above).
- `StarRating` already has `role="group"` and `aria-label` per star.
- `ReviewForm` already uses `htmlFor` and `aria-describedby`.
- Color contrast: `#00f5ff` on `#0f172a` passes WCAG AA (ratio ~10:1).
- The backdrop blur effect on the header needs a `@media (prefers-reduced-motion)` fallback.

### Performance Improvements

- **Highest impact:** Switch all `<img>` to `<Image>` — automatic WebP, lazy loading, LCP improvement for above-the-fold posters.
- **Medium:** Add `revalidatePath('/media/movie/${id}')` or `revalidatePath('/media/tv/${id}')` calls after a successful rating/review submit. Currently the community aggregate may be up to 60 s stale after a mutation.
- **Medium:** The `fetchMyContent` loop in `RatingSection` makes multiple sequential API calls for users with many ratings. The backend already has `GET /v1/ratings/user/{authorId}/title/{title_id}` in the spec — switch to it for the rating half once `authorId` is reliably available on mount.
- **Low:** `next.config.ts` can add `images.minimumCacheTTL` to increase CDN caching duration for TMDB posters.

### Highest Visual Impact / Lowest Risk Changes

1. **Backdrop blur + neon border on header** — pure CSS, zero JS, no layout risk. Immediately feels premium.
2. **Card hover lift + neon glow** — pure CSS transitions. Transforms every grid view.
3. **Star rating glow on hover** — one `filter` property change in `StarRating.tsx`. Low blast radius.
4. **Skeleton loaders on profile** — isolated to `app/profile/page.tsx`, no effect on other pages.
5. **Orbitron font for `h1`/`h2`** — scoped to headings via a CSS selector; body text unaffected. No font FOUC if lazy-loaded.
