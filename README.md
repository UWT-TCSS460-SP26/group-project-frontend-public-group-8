## Front-end URL

https://group-project-frontend-public-group.vercel.app/

## Group 7 API Details

Group-7's Deployed API Base URL: https://tcss-460-group-7.onrender.com

Group-7's API doc: https://tcss-460-group-7.onrender.com/api-docs

Group-7's Bug Tracker: https://group-7-bug-report.onrender.com/

Group-7's Audience String: group-7-api

Group-7's Partner-Facing README: https://github.com/UWT-TCSS460-SP26/tcss-460-group-7/blob/main/README.md

## Auth — Required Environment Variables

Copy `.env.example` to `.env.local` and fill in the values before running locally.

| Variable | Value |
|---|---|
| `AUTH_TCSS460_CLIENT_ID` | `group-8-consumer` |
| `AUTH_TCSS460_CLIENT_SECRET` | from instructor |
| `AUTH_SECRET` | run `openssl rand -base64 32` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://tcss-460-group-7.onrender.com` |

The same four variables must be set in Vercel project settings for the deployed site.
