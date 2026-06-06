# Sprint-6 Meeting

5/22/2026

4:20 pm - 6:00 pm

Attending: Caleb, Christina, Charlene

Meeting Manager: Caleb Ernst

Meeting Scribe: Charlene Jarrell

## Agenda Item 1:

_First user story: As a team, we want to make first contact with our upstream partner group so that we know which API our consumer app is built on._

Group-7's Deployed API Base URL: https://tcss-460-group-7.onrender.com

Group-7's API doc: https://tcss-460-group-7.onrender.com/api-docs

Group-7's Bug Tracker: https://group-7-bug-report.onrender.com/

Group-7's Audience String: group-7-api

Group-7's Partner-Facing README: https://github.com/UWT-TCSS460-SP26/tcss-460-group-7/blob/main/README.md

Caleb messaged Group 7 to add our fronted to their CORS and Group 9 to get their deployed URL to add to our CORS.

## Agenda Item 2:

_Second user story: As a team, we want to request our NextAuth consumer-client credentials from the instructor so that we can complete the OAuth2 flow against Auth²_

Caleb completed in class yesterday.

## Agenda Item 3:

_Remaining user story assignment_

As a visitor, I want to sign in to the consumer app so that I can access features that need an account. (Caleb)

As a user, I want to confirm my sign-in actually worked so that I can trust the rest of the app's auth-gated behavior. (Caleb)

As a visitor, I want to search my partner team's API for movies and shows so that I can find something to read about. (Charlene)

As a visitor, I want to browse what's popular or trending so that I have something to look at before I search. (Charlene)

As a visitor, I want to open a movie or show detail page so that I can read about something before deciding whether to (eventually) rate it. (Mansur)

## Agenda Item 4:

_Questions_

1. Where do we use http://localhost:3000/api/auth/callback/tcss460?
2. Do we need a page on our frontend to connect to Group 7's bug tracker or ours?


# Sprint-7 Meeting

5/29/2026

3:00 pm - 4:15 pm

Attending: All

Meeting Manager: Caleb Ernst

Meeting Scribe: Charlene Jarrell

## Agenda Item 1:

_Sprint completion planning_

Decided process:
1) Fix the items discussed in meeting with Charles (community rating, search bar, favicon)
2) Use claude to complete all sprint user stories
3) Fine tune the functionality of the api
4) Everyone get creative in their own branch adding a theme and pizazz
5) We decide on a theme to keep or possibly give the user multiple theme options

## Agenda Item 2:

_Brainstorming_

All ideas posted in the brainstorming channel of our discord server. Ideas included themes, a name for the db, and what to use for the favicon.


# Sprint-8 Meeting

6/5/2026

3:40pm - 5:30pm

Attending: All

Meeting Manager: Caleb Ernst

Meeting Scribe: Charlene Jarrell

## Agenda Item 1:

_Pre-Sprint Tasks_

1. Fix hero search so the drop-down overlaps the page (instead of being see-through)
2. Add warning window for deleting reviews and ratings. Use non-native prompt (one we design)
3. Let non-developers test the API. Ensure that it is intuitive
4. Fix nav bar so on a phone screen, the search bar is not overlapping the sign-in button
5. Style light mode
6. Be able to scroll movies in safari browser
7. Recommendation system

## Agenda Item 2:

_Follow-up on Creative Contributions_

Mansur - play trailors - in-progress
Caleb - cyberpunk theme - merged to main
Group - magic 8 ball

## Agenda Item 3:

_Follow-up on active bug reports to Group 7_

1. Request for routes to search movies by genre and cast (same that TV shows has)
2. Request for pulling user upvotes and downvotes on their movies and shows

## Agenda Item 4:

_Reflect on Quarter_

1. What went well across the ten weeks

We built a full stack web application! We recieved high scores on our sprints each week.
We were accomodating of each other's schedules.
We delegated work well throughout the quarter based on each person's availablility. Some weeks certain teammates did more work because they were available, but the other teammates did more the next week.
We worked well as a team under pressue and remained respectful of each other.
We communicated well through discord and virtual meetings.
We did well documenting what we didn't know so we could research it together. Everyone felt comfortable admiting if they didn't understand something and the rest of the team was able to explain in a way that helped.

2. What you'd do differently if you were starting the quarter again

Start the check-offs a week sooner. 
Make a personal due date of one day earlier--once we got behind we got really got behind. Allow more time to study before completing the sprint objectives.
Getting buy-in from the team for unique ideas by providing more details and research-backed information.
Speaking up when the workload is too much.

3. What surprised you about working on someone else's API and having someone else work on yours

Surprised the group using our backend didn't submit any bug reports.
Working on someone else's frontend helped us to understand what a frontend developer would want from a backend.
Initial hurdle of granting permissions through CORS list. 
We liked some of the extra features the backend added (search by genre, upvote/downvote) and we would like to add them to ours.

4. What you learned about working with AI coding agents that you didn't know in Week 1

Using code-based AI for first time. Used sandbox where it pulled from github branch only.
Used code-based Claude for the first time and realized why people like it. More accurate and increased production.
Learned how to prompt better.
More risk is more reward. More access gets better results, but exposes your system.
AI browser was more learning oriented while AI code agent was more implementation oriented without explaination.

## Agenda Item 5:

_Accessibility Check_

Everyone ran lighthouse tool on homepage light and dark mode as well as detail page. Upload results to repo.

## Agenda Item 5:

_Team availability_

Christina - final on thursday, multiple assignments due by sunday
Caleb - final on tuesday, multiple assignment due tonight (friday)
Mansur - project due sunday next week
Charlene - not available monday
All - preparing for commencement ceremony