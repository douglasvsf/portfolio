# GODZILLA Spotify Stats

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-3-1DB954)
![Jest](https://img.shields.io/badge/tested_with-Jest-C21325?logo=jest&logoColor=white)
![Cypress](https://img.shields.io/badge/e2e-Cypress-69D3A7?logo=cypress&logoColor=white)
![Vercel](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)

A personal music-stats dashboard built on the **Spotify Web API**. Connect your Spotify account to see your top artists, top tracks, genres, recent plays and what's playing right now. You can also explore the **demo mode** without logging in.

Live at **`/spotify`** in the portfolio (same deploy as the site): <https://portfolio-web-nu-khaki.vercel.app/spotify>

---

## Overview

- **Product:** landing page → Spotify OAuth → dashboard with Overview, Top Artists, Top Tracks and Recently Played.
- **Stack:** Next.js (App Router) and nothing else in production. No database, no Redis, no separate server. Sessions are encrypted cookies.
- **UI:** built with the portfolio's own Design System (`@godzilla/ui`, shadcn/ui on Radix + Tailwind), with a Spotify-inspired *skin*. It uses the same components with different tokens.

## Features

| Area | What it shows | Spotify endpoint |
| --- | --- | --- |
| Overview | Top artist / track / genre / last play cards, *Now playing*, *Your Music Profile*, 2 charts | all below |
| Top Artists | Ranking with a top-3 podium, genres, followers and popularity *when available* | `GET /me/top/artists` |
| Top Tracks | Table (desktop) / compact cards (mobile): cover, track, artist, album, duration | `GET /me/top/tracks` |
| Recently Played | Timeline of the last 50 plays, grouped by day in the visitor's time zone | `GET /me/player/recently-played` |
| Now playing | Cover, progress bar that advances in real time, refreshed every 20 s | `GET /me/player/currently-playing` |
| Genres | Donut chart **derived from the top artists' genres** (the chart says so) | from `/me/top/artists` |
| Periods | `4 weeks` · `6 months` · `1 year` (`short_term`, `medium_term`, `long_term`) | `time_range` |
| Demo mode | The whole dashboard with mock data. No Spotify account needed | — |

## Tech Stack

- **Next.js 16** (App Router, Server Components, Route Handlers, Server Actions, Proxy)
- **React 19** + **TypeScript** (strict, no `any`)
- **Tailwind CSS 4** + **shadcn/ui** (via `@godzilla/ui`) + **Lucide** (via `@godzilla/icons`)
- **Recharts 3** via the Design System's `Chart` component
- **Jest** (unit tests) + **Cypress** (E2E) + **ESLint** + **Prettier**
- **Vercel** (Hobby / free tier)

## Architecture

```text
apps/web/src/
├── app/
│   ├── spotify/
│   │   ├── layout.tsx            # own root layout (theme, SEO, attribution)
│   │   ├── page.tsx              # landing page
│   │   ├── actions.ts            # Server Action: logout / exit demo
│   │   ├── spotify.css           # Design System token "skin"
│   │   └── (app)/                # authenticated area (session or demo)
│   │       ├── layout.tsx        # header + navigation + auth guard
│   │       ├── dashboard/        # Overview   (page + loading skeleton)
│   │       ├── artists/          # Top Artists
│   │       ├── tracks/           # Top Tracks
│   │       ├── recently-played/  # Recently Played
│   │       └── error.tsx         # friendly error boundary
│   └── api/spotify/
│       ├── login/                # starts OAuth (state + PKCE)
│       ├── callback/             # validates state, exchanges code, validates token
│       ├── demo/                 # turns demo mode on
│       └── now-playing/          # player polling (no-store)
├── components/spotify/           # UI: common, layout, dashboard, charts, artists, tracks, recent
├── config/spotify.ts             # routes, scopes, periods, cache times
├── lib/spotify/
│   ├── types.ts                  # SpotifyArtist, SpotifyTrack, CurrentlyPlaying, …
│   ├── client.ts                 # the only HTTP point: headers, timeout, cache, errors
│   ├── endpoints.ts              # getTopArtists(), getTopTracks(), getRecentlyPlayed(), …
│   ├── auth.ts                   # OAuth: authorize URL, code exchange, refresh
│   ├── session.ts / crypto.ts    # encrypted cookie session (AES-256-GCM) + PKCE
│   ├── proxy.ts                  # renews the token before rendering
│   ├── source.ts                 # "live" or "demo" data source (pages don't know which)
│   ├── transform.ts              # pure functions: genres, profile, grouping, formatting
│   ├── mock-data.ts              # demo mode data
│   └── errors.ts                 # SpotifyApiError + friendly messages
└── proxy.ts                      # portfolio i18n + Spotify session refresh
```

**Layer separation:** pages (Server Components) ask `getSpotifySource()` for data. The source calls `endpoints.ts`, which calls `client.ts`. `transform.ts` turns the responses into UI data. Components only receive ready-made data.

**Cache** (Next.js Data Cache; the key includes the `Authorization` header, so each user has their own cache):

| Data | Cache |
| --- | --- |
| Profile | 1 h |
| Top artists / tracks | 5 min |
| Recently played | 30 s |
| Currently playing | none (`no-store`) + 20 s polling in the browser |

## Authentication

**Authorization Code + PKCE**, running entirely on the server:

```text
Landing ─▶ /api/spotify/login ─▶ accounts.spotify.com/authorize ─▶ /api/spotify/callback ─▶ /spotify/dashboard
             state + code_verifier       user authorizes              validates state (timing-safe)
             in an encrypted cookie                                   exchanges code + verifier (+ Basic auth)
                                                                      validates the token with GET /me
                                                                      creates the encrypted session
```

- **Scopes:** `user-top-read`, `user-read-recently-played`, `user-read-currently-playing`, `user-read-playback-state`. Read-only.
- **Tokens** live in an `httpOnly` + `secure` + `sameSite=lax` cookie, **encrypted with AES-256-GCM**. They are never readable by JavaScript and never exposed in the client.
- **Refresh:** the Next.js Proxy renews the access token when less than 1 minute is left, before the page renders. A revoked refresh token ends the session.
- **Logout:** a Server Action that deletes every app cookie.
- `SPOTIFY_CLIENT_SECRET` is only read on the server and never uses the `NEXT_PUBLIC_` prefix.

## Environment Variables

In `apps/web/.env.local` (template in [`apps/web/.env.example`](../apps/web/.env.example)):

```env
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/spotify/callback
MOCK_MODE=false   # true = everyone sees demo mode
```

> ⚠️ Spotify **does not accept `localhost`** as a redirect URI; only `127.0.0.1` (or HTTPS). Open the site at `http://127.0.0.1:3000`. If you open it via `localhost`, the login route redirects you to the right host before starting OAuth, so the cookies end up in the right place.

## Running Locally

1. Create an app at <https://developer.spotify.com/dashboard> (Web API).
2. Register the redirect URIs:
   - `http://127.0.0.1:3000/api/spotify/callback`
   - `https://<your-domain>/api/spotify/callback`
3. Under **User Management**, add the Spotify accounts that are allowed to log in (Development Mode).
4. Fill in `apps/web/.env.local` and run:

```bash
pnpm install
pnpm dev:web
```

Open <http://127.0.0.1:3000/spotify>. To try it without Spotify, click **View Demo**.

## Testing

```bash
pnpm --filter web test        # Jest — transforms, genres, PKCE, session, client, errors, mocks
pnpm --filter web typecheck   # tsc --noEmit (strict)
pnpm --filter web lint        # ESLint
pnpm --filter web test:e2e    # Cypress — starts the dev server and runs every spec
```

The E2E tests (`cypress/e2e/spotify.cy.ts`) **don't touch the real Spotify API**: the mocked login is demo mode. They cover the landing page, OAuth error messages, the auth guard, the dashboard, the period filters, navigation, logout and mobile behavior (cards instead of a table, no horizontal scroll).

## Deployment

It deploys together with the portfolio (Vercel project for `apps/web`); there's no separate project.

1. **Vercel → Settings → Environment Variables:** `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI=https://<domain>/api/spotify/callback`.
2. Register that same production URI in the Spotify dashboard.
3. Redeploy.

Without the variables, the app still works in demo mode, and "Connect Spotify" shows a friendly message.

## Screenshots

| Landing | Overview | Top Artists |
| --- | --- | --- |
| `/spotify` | `/spotify/dashboard` | `/spotify/artists` |

> Run the demo (`/api/spotify/demo`) to see every screen with mock data.

## Limitations

- **Development Mode (Spotify, Feb/2026):** up to **5 users** allow-listed in the dashboard, and the app owner needs Premium. That's why demo mode is the main way for visitors to explore the project. Opening it to everyone requires *Extended Quota Mode*, which Spotify only grants to companies.
- In Development Mode, Spotify **no longer sends `popularity` or `followers`** for artists and tracks. The UI hides those fields (and the popularity chart) when they're missing. Demo mode includes them to show the full layout.
- Genres come from the **top artists** (up to 50), not from your full history. Spotify may send an empty list, and the UI shows an empty state in that case.
- *Recently played* only goes up to the **last 50 plays**. The API offers no full history, and this project **is not a Wrapped** replacement.
- *Now playing* ignores podcasts, ads and private sessions (the API sends no track in those cases).

## Future Improvements

- Artist/track pages with details (albums, top tracks when the API allows)
- Export stats as a shareable image
- Comparing periods (what went up/down between 4 weeks and 6 months)
- Optional light mode (the tokens are ready; only the toggle is missing)
- i18n (pt-BR / es-ES) using the portfolio's `@godzilla/i18n`

---

Data provided by [Spotify](https://www.spotify.com). GODZILLA Spotify Stats is an independent project, not affiliated with or endorsed by Spotify.
