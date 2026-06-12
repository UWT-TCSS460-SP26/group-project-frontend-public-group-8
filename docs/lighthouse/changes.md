# Details Page
The performance score for the details page was already 100, so we focused on accessibility issues.
To fix the accessibility issues, we had to adjust the text colors to have more contrast with the background.
There was also an issue with the "YOUR RATING" header tag. It was the wrong level, so we switched it from h3 to h2.

# Front Page
The only performance issue for the front page was a too high cumulative layout shift. To fix it,
we added width and height attributes to the img elements in both `app/genre/[slug]/page.tsx` and 
`components/GenreCarousel.tsx`, and removed the loading="lazy" attribute. This brought the score up to 100.

There were two accessibility issues. The problems with contrast required us to tweak text and background colors 
until the contrast was high enough. We fixed the issue with redundant alt text by setting the alt attribute of the
images to an empty string in `components/GenreCarousel.tsx`, `components/Header.tsx`, and `app/genre/[slug]/page.tsx`.

**Update: despite scoring 100 on performance, we improved image retrieval/handling performance. Here is the summary of changes:*

1. Media Detail Page (app/media/[type]/[id]/page.tsx): Optimized the main title poster with a fixed 200x300 layout and priority loading.
2. Profile Page (app/profile/page.tsx): Optimized movie and TV show thumbnails in the user's ratings and reviews.
3. Search Page (app/search/page.tsx): Refactored search result posters for faster rendering.
4. Home Page Carousels:
    * Genre Sections (components/GenreCarousel.tsx): Integrated optimized images for all browse-by-genre carousels.
    * Featured Section (components/PopularMediaSelector.tsx): Optimized the prominent featured movie and TV show cards.
    * Recent Activity (components/RecentActivity.tsx): Improved image handling for the user's latest interactions.
    * Community Favorites (components/CommunityFavorites.tsx): Optimized posters for the top-rated community titles.
5. Global Header (components/Header.tsx): Refactored the logo icon for better performance during initial page loads.
6. Hero Search (components/HeroSearch.tsx): Optimized poster previews in the dynamic search suggestion dropdown.

We used `<Image />` from `next/image` to optimize images. 
