Sprint 7 — Consumer App: Rate & Review

MVP
By the end of this sprint, a signed-in user on your consumer app can submit a rating and a review against your upstream partner's API, see those items rendered back on the partner's enriched detail page (community aggregate + their own contribution), and view their own ratings and reviews on a profile page. They can edit or delete content they own. Every authenticated request attaches the access token from the NextAuth session. Signed-out visitors see inert affordances — a "Sign in to rate" placeholder where the rate button lives for signed-in users — not a broken control.

User Stories

1. As a user, I want to rate a movie or show so that I can record how I felt about it. I want a 5-star widget to do this.
From the detail page, a signed-in user submits a rating against your upstream partner's rating route. Your fetch attaches the bearer token from the NextAuth session. After a successful submit, the detail page reflects the rating—refetched from the partner's enriched detail route. 

2. As a user, I want to write a review so that I can share my thoughts with other people who watched it.
A review form on the detail page. Read your partner's OpenAPI spec to learn what their review payload requires. Wire form validation, a visible submit state, and an error path for the case where the partner returns a 400 or 401.
After a successful POST, the user's review appears in the partner's review list for that title. Accessible form labels and focus management are part of the bar this sprint — this is the most form-heavy thing your app does.

3. As a user, I want to edit or delete content I own so that I can change my mind or fix a mistake.
Ratings and reviews you submitted should expose edit and delete affordances when you're the author. PUT/DELETE against your partner's routes with the bearer token attached. Whether edit happens inline, in a modal, or on a dedicated route is your team's design call.
If the partner's contract does not actually expose update or delete on a resource you thought it would, file a bug against them; do not work around it.

4. As a user, I want a profile page that shows everything I've rated and reviewed so that I can see my activity in one place.
Hit your partner's "own content" routes — typically something shaped like /users/me/ratings and /users/me/reviews, possibly an enriched combined route that joins TMDB metadata onto the user's items. Render the list(s) on a /profile route (or whatever path you chose for the sign-in surface in Sprint 6).
This is also the natural surface for the edit/delete affordances from Story 3. A user looking at their own list of reviews should be able to fix one. The page shape is bounded by what your partner returns; if their "my ratings" route doesn't enrich with TMDB metadata, you either fetch the metadata yourself per row or accept a thinner UI.

5. As a visitor, I want write affordances to be inert when I'm not signed in so that the app doesn't appear broken when I haven't logged in.
Sprint 6 said "no write affordances rendered yet." Now they exist — but only for signed-in users. A signed-out visitor on a detail page sees a "Sign in to rate" placeholder where the rate control lives for signed-in users, and a similar treatment on the review form. Do not render a button that 401s when clicked.
The useSession hook (or the equivalent server-component check) is the signal. Signed-out copy still needs to be readable, keyboard-reachable, and clearly labeled as a sign-in prompt — not a disabled mystery control.

Deliverables
Signed-in users can submit a rating against the partner's API; the rating renders back on the detail page
Signed-in users can submit a review against the partner's API; the review appears in the partner's review list for that title
Signed-in users can edit and delete ratings and reviews they own
Profile page renders the signed-in user's own ratings and reviews (one route, both lists, or two routes — your call)
All authenticated requests attach the bearer token from the NextAuth session in the Authorization header
Signed-out visitors see inert affordances (sign-in prompts, not 401-bound buttons) anywhere a write would otherwise appear
Form validation and error states present on the review form (and the rating control if it has a failure mode)
App has been walked end-to-end as a team for design and UX cohesion; button styles, spacing, typography, and component choices are consistent across views
