Sprint 6 — Consumer App: Sign-In & Browse

Sprint Narrative
The swap happens this week. You're no longer the back-end team — you're the front-end team on top of an upstream partner's deployed API, the one they hardened for partner-ready handoff at the end of Week 6. Two firsts land together: your first contact with the partner whose contract you'll build against for three sprints, and the first real OAuth2 sign-in via NextAuth against the deployed Auth² instance. The product side stays narrow: the first read-only pages — search, browse, and a movie/show detail page — rendering against your partner's API. No ratings, no reviews, no writes yet; those arrive in Sprint 7. The bar this week is I can sign in, find something on the partner's API, and read about it.

MVP
By the end of this sprint, your team has made contact with your upstream partner group, holds its consumer-client credentials from the instructor, and can sign a visitor in through NextAuth against the deployed Auth² instance with an access token audience-scoped to your upstream partner's API. The deployed (or local) consumer app renders search results, a browse or popular page, and a movie/show detail page against your partner's deployed API. The session's access token decodes with the correct aud claim for your partner's audience. No writes ship this sprint — rating and reviewing arrive in Sprint 7.

The Swap
Sprint 6 is when the ring rotates. Your group has been the back-end team for the last six weeks; starting Tuesday of Week 8, you're the front-end team in a different company.

Your upstream partner is Group N−1. Their deployed API is the one your consumer app talks to for the next three sprints.

User Stories
As a team, we want to request our NextAuth consumer-client credentials from the instructor so that we can complete the OAuth2 flow against Auth².¶
Send your planned deployed FE URL (Vercel, Render, or whatever host you picked — if you're undecided, pick now). The instructor will add your callback path — /api/auth/callback/tcss460 — to your group's pre-seeded consumer client in the tcss460-sp26 tenant and return your clientId and clientSecret. Your client is already wired with an allowed audience pointing at your upstream partner's API; you do not need to ask for the audience to be configured.
Include http://localhost:3000/api/auth/callback/tcss460 in the same request so local development works alongside the deployed URL.

As a visitor, I want to sign in to the consumer app so that I can access features that need an account.¶
Wire NextAuth (Auth.js v5) with Auth² as a custom OIDC provider. The values you need:
Issuer: https://tcss-460-iam.onrender.com (no trailing slash — this is the single most common source of silent verification failures)
OAuth endpoints: discovered automatically from the issuer's .well-known/openid-configuration; if you wire them manually, they live under /v2/oauth/*
Audience: your upstream partner's audience string (from Story 1)
Client ID / secret: from Story 2
A visitor clicks "Sign In", lands on Auth²'s hosted login page, signs in (or registers an account on the spot), and is redirected back into your app with a NextAuth session. That session holds the access token, the id token, and the basic profile (sub, email, role).

As a user, I want to confirm my sign-in actually worked so that I can trust the rest of the app's auth-gated behavior.¶
Add a visible sign-in / sign-out surface — a header button, a /profile page, or both — that shows the signed-in user's email and a sign-out action. A signed-out visitor sees a "Sign In" affordance in the same spot.
As a one-time verification step, decode your session's access token at jwt.io and confirm:
iss matches https://tcss-460-iam.onrender.com
aud matches your upstream partner's audience string exactly
A wrong aud claim is the single most common Sprint 6 bug — your sign-in flow looks successful, NextAuth gives you a session, but every authenticated call to your partner's API returns 401. Catch it here, not in Sprint 7.

As a visitor, I want to search my partner team's API for movies and shows so that I can find something to read about.¶
Build a search page that calls your upstream partner's search route. Their route shape is theirs, not yours — read their OpenAPI spec to learn the query parameter names, the response field names, the result-envelope shape, and the pagination scheme they chose. Render results as a list or grid of cards using whatever fields their response actually gives you (title, year, poster, overview, etc.).
No auth is required here unless your partner made the route protected. If they did, the bearer token from your NextAuth session is what you attach; the guide and FE-2 both show the pattern.

As a visitor, I want to browse what's popular or trending so that I have something to look at before I search.¶
Use your partner's browse / popular / trending route — whichever they chose to expose. This is your landing page or a dedicated /browse route. Same exercise as search: read their spec, render the shape they return. If they exposed several browse routes (popular and trending and top-rated), pick one for this sprint and light the rest up later; the goal is one working browse surface, not exhaustive coverage.

As a visitor, I want to open a movie or show detail page so that I can read about something before deciding whether to (eventually) rate it.¶
A detail page driven by your partner's detail route — typically keyed off a TMDB id you picked up from search or browse. Render the poster, synopsis, runtime, release date, and any enriched fields your partner shipped on their combined detail route from their Sprint 3 (community rating aggregate, recent reviews). What the page shows is bounded by what your partner's response actually contains.
Do not render write affordances yet — no rate button, no review form. Those wire up in Sprint 7. A "Sign in to rate" placeholder is fine if it helps the UI feel intentionally unfinished rather than broken.

As a frontend developer, I want to file structured bugs in my partner's Bug Tracker FE so that I have a real channel when their contract surprises me.¶
When your partner's API returns something their spec didn't promise, 500s on a request that looks valid, or rejects a token that decodes correctly, file a bug in their Bug Tracker FE — the URL you collected in Story 1. Title, description, which endpoint you hit, reproduction steps.

Deliverables
Upstream partner contact made; their API base URL, OpenAPI URL, Bug Tracker FE URL, audience string, and README link recorded in your team repo
Consumer-client credentials request sent to the instructor by Thursday, May 21, 11:59 PM with your deployed FE URL and localhost:3000 callback
Sprint 6 GitHub Classroom group repository accepted; consumer app committed to it
NextAuth configured with Auth² as an OIDC provider, audience-scoped to your upstream partner's API
Visible sign-in / sign-out surface in the app
Session access token decodes with iss and aud claims matching the configured values (verified at least once at jwt.io)
Search page returning results from the partner's search route
Browse / popular page returning results from one of the partner's browse routes
Movie/show detail page rendering one of the partner's detail routes
No write affordances rendered (no rate, no review, no profile mutations) — those are Sprint 7
At least one structured bug filed in your partner's Bug Tracker FE if their API misbehaved (none required if their API worked cleanly)
Meeting minutes document updated with sprint planning and any ceremonies
