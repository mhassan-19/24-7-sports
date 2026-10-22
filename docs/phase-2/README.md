# Phase 2: Website

Status: **delivered, waiting for approval** (2026-10-22).

## What was built

A React 19 + Vite SPA in `apps/web`, on shared packages that the mobile app will reuse in
Phase 3 (`domain`, `api`, `data`, `i18n`, `tokens`). Every screen from the Phase 1 plan is
implemented against verified endpoints only.

| Screen | Route | Endpoints |
|:--|:--|:--|
| Home | `/ar` | `homeCalendar`, `mixMedia`, `tournaments/:id`, `teamsStanding`, `topLeaguePlayers` |
| Matches (filter by competition) | `/ar/football/matches?day=&competition=` | `homeCalendar` |
| Match centre (events, lineups, stats, head to head, news) | `/ar/football/match/:id/:tab?` | `matchStatistics`, `match_events`, `newLineup/:id`, `newLatest-matches-for-teams`, `matchMedia` |
| Competitions | `/ar/football/competitions?region=&q=` | `activeTournaments`, `services` |
| Competition: league (table, matches, stats, teams, history) and cup (overview, table, matches, knockout, stats, teams, history) | `/ar/football/competition/:id/:tab?season=` | `tournaments/:id`, `teamsStanding`, `tournamentCalendar`, `tournament/matches`, `topLeaguePlayers`, `tournament-teams`, `knockout-stage-bracket`, `tournament-progress`, `team-of-the-week`, `tournament-history/:id`, `tournament-most-last-winner` |
| Leaders | `/ar/football/competition/:id/leaders/:kind` | `top-scorers`, `top-assists` |
| Team (matches, squad, stats, photos) | `/ar/football/team/:id/:tab?` | `teams/:id`, `teamCalendar`, `teams/:id/squad`, `teamStatistics`, `al-ahly/galleryList/:id`, `teamGallery/:id` |
| Player (stats, career) | `/ar/football/player/:id/:tab?` | `players/:id/details`, `players/:id/statistics`, `player-history-details/:id` |
| Transfers | `/ar/football/transfers` | `transferes` |
| News, article | `/ar/news`, `/ar/news/:id` | `media`, `media/:id` |
| Search: as-you-type in the header (desktop dropdown, phone sheet) and a full results page | header everywhere; `/ar/search?q=` | `full-search` |
| Games: guess, prediction, team of the round | `/ar/games`, `/ar/games/:id` | `games`, `games/:id`, `POST` answer endpoints |
| Settings, More (phone nav), 404 | `/ar/settings`, `/ar/more` | — |

Cross-cutting: Arabic RTL by default with Arabic-Indic digits and Cairo; English LTR behind
`VITE_FEATURE_ENGLISH`; dark/light/system theme remembered per device and applied before first
paint; Egypt time everywhere; skeleton/empty/error/offline states on every query; cached data
readable offline (24 h); live polling every 30 s while a live match is on screen; per-route
title, description, canonical and Open Graph tags; `robots.txt` (and `sitemap.xml` once the
production domain is set); skip link, landmarks, keyboard-reachable tabs, visible focus,
`aria-live` scores.

## Verification

| Check | Result |
|:--|:--|
| `typecheck` (6 packages) | pass |
| `lint` (ESLint + stylelint with logical-properties rule) | pass, 0 warnings |
| `test` (unit + component, 70 tests in 6 packages) | pass |
| `build` | pass; each screen is its own chunk (1–9 KB) |
| `e2e` (Playwright, Edge; desktop + phone; Arabic dark and light, English; axe WCAG A/AA) | 10/10 pass, no serious or critical accessibility issues |
| Manual walkthrough on TEST data | every screen, both languages, both themes |
| Production build against PROD (read-only) | home loads today's real fixtures; `/en` redirects to `/ar` (English off) |

## Changes from the Phase 1 plan

1. **No `ui-web` package.** Web components live in `apps/web/src/ui` and `src/features`. The
   mobile app won't share them, so a separate package added packaging with no reuse.
2. **No zod.** Lenient hand-written readers (`packages/api/src/read.ts`) plus mapper tests
   against recorded TEST responses do the same job with less code.
3. **Shared config at the root** (`tsconfig.base.json`, `eslint.config.js`,
   `stylelint.config.js`) instead of a `packages/config` package.
4. **pnpm runs through corepack** and is also a root dev dependency, so Turborepo can find it
   without a global install.
5. **Game answers are sent as form data.** PROD's CORS preflight doesn't allow POST, and form
   posts skip the preflight.

## API findings during Phase 2

- Answer bodies, read from TEST validation errors (empty or invalid bodies, nothing saved):
  guess `user_identifier` + `guess_game_choice_id`; squad `user_identifier` + `answer[]` with
  exactly 11 players; prediction validates `game_fixture_id` first. All TEST prediction fixtures
  are closed ("Predictions are closed for this match"), so the rest of that body is still
  unconfirmed (N1).
- `user_identifier` is optional when `source` is `app` (for logged-in apps later).
- Group-stage standings (AFCON) come back as one flat list with no group names, so the table
  shows one list.
- Loan transfers carry fee `"0"`; shown as no fee.
- The TEST API slows down under parallel requests (the e2e suite runs with 2 workers).

## Real-data check on PROD (22 Oct 2026, read-only)

Ran the dev server against `v3.appkora.com` (`corepack pnpm dev:web:live`) and walked every
screen. Real data changed four things:

- **Group tables:** World Cup and AFCON now show named groups (from `tournament/standing`)
  instead of one mixed 60-row list. Competitions flagged `has_standing` (e.g. Champions League)
  now get a Table tab.
- **Unknown values:** the API sends `0` for unknown ages, heights, weights, ratings and pass
  accuracy; these now show as missing instead of "٠".
- **Player season:** the stats selector opens on the newest season.
- **Offline cache:** it is now dropped when the app is rebuilt, so fixed mappings show up at once.

Seen on PROD and left as is: some logos are broken (`.txt` URLs) and fall back to initials; news
photos are 2048 px originals (an image-resizing endpoint would cut data use); duplicate season
titles exist for some competitions; prediction game 1 has one closed fixture (World Cup final).

## Review changes (22 Oct 2026)

- **Matches filter:** one chip per competition playing that day (e.g. Saudi League, Conference
  League, Europa League) instead of regions (Local, International, …). The choice is kept in the
  URL (`?competition=`).
- **Search:** results now appear while typing, without leaving the page: a dropdown under the
  header field on desktop (arrow keys, Enter, Escape) and a full-screen sheet from the search
  icon on phones. The full results page stays for "See all results" and shared links, and now
  follows the URL when a new search starts from the header.
- Long team names wrap to two lines inside their column instead of running into the score.
- A competition that the API returns as a single named group (Egyptian League, "Premier League
  26/27") shows no group heading.

## Known gaps

- English content: the API is Arabic only, so English stays off in production.
- Matches: yesterday, today, tomorrow only (agreed, Q1).
- Live match states are covered by unit tests only: TEST has no live match.
- Prediction submit is unverified end to end (closed fixtures) and the draw body is pending (N1).
- Live states on real data: the production build was checked against PROD (read-only) on
  22 Oct 2026 and showed today's 38 fixtures, but none was in play at the time.
- Initial JavaScript is ~155 KB gzip; the shared vendor chunk can be trimmed later.
- SPA SEO limits: content renders client-side. Prerendering the static routes is the next step
  if search traffic matters at launch.

## Deploying

`corepack pnpm build` → upload `apps/web/dist` to any static host with an SPA fallback (every
unknown path serves `index.html`) and long-term caching for `/assets/*`.

## Open items, each with a recommendation

| # | Item | Recommendation |
|:--|:--|:--|
| P1 | Production domain (canonical URLs, `sitemap.xml`) | Send the domain; it goes in `VITE_SITE_URL` in `.env.production`. |
| P2 | Hosting | Any static host with SPA fallback (e.g. Cloudflare Pages or Netlify): no server needed. |
| N1 | Prediction answer body for a draw | Backend confirms; the app sends `outcome` plus `predicted_team_id` today. |
| P3 | Live check | Point a dev build at PROD (read-only) during a real match to verify live polling and phases. |
| P4 | First commit and push to `github.com/mhassan-19/24-7-sports` | Approve and I'll commit Phase 1 + 2 and push `main`. |
