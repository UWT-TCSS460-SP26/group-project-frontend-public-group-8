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
