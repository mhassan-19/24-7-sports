# Phase 1: Plan and UI/UX

Status: **waiting for approval** (updated 2026-10-22). Nothing in Phase 2 starts until it is approved.

## Deliverables

| # | Deliverable | Where |
|:--|:--|:--|
| 0 | API audit: every documented endpoint checked on TEST, conventions, discrepancies | [../api/API_AUDIT.md](../api/API_AUDIT.md) |
| 1 | Feature inventory: feature → endpoints → screens | [01-feature-inventory.md](01-feature-inventory.md) |
| 2 | Information architecture, navigation, user flows | [02-ia-navigation-flows.md](02-ia-navigation-flows.md) |
| 3 | Screens for web and app, with loading/empty/error/offline states | [03-screens-and-states.md](03-screens-and-states.md) |
| 4 | Design tokens and component library (light/dark, RTL/LTR) | [04-design-system.md](04-design-system.md) |
| 5 | Clickable prototype + written spec | Prototype: [artifact link](https://claude.ai/artifact/D4MSHdQr5DqXqz7z864uqU) · source [prototype/](prototype/) · spec = documents 2–4 |
| 6 | Recommended but not built | [06-recommended-not-built.md](06-recommended-not-built.md) |
| 7 | Technical plan, phases, risks | [05-technical-plan.md](05-technical-plan.md) |

### Prototype

- Toolbar: jump to any screen, Web/Phone layout, state (normal, loading, empty, error, offline),
  Arabic/English preview, Dark/Light/System, White/Concrete cards (light theme comparison), and
  "API notes" showing the endpoint behind each section.
- Data is a real GET snapshot from TEST, trimmed (`prototype/src/data.json`). Crests and photos
  are placeholders. Full detail exists for one sample per entity (Brighton–Bournemouth, Premier
  League, Brighton, Haaland, one article, one game of each type); other links say so.
- Rebuild after editing `prototype/src/app.html`: `node docs/phase-1/prototype/build.mjs`
  (writes `index.html` for local viewing and `artifact.html` for publishing).

## Decisions

| Date | Decision | By |
|:--|:--|:--|
| 2026-10-21 | v1 scope: football core + football games on the appkora host | Product owner |
| 2026-10-21 | Out of scope: Twist account management, TPay, telco subscriptions, fitness, legacy hosts | Product owner |
| 2026-10-21 | Launch in Arabic; English built and hidden behind a flag | Product owner |
| 2026-10-21 | v1 is guest-only (consequence of the above) | — |
| 2026-10-22 | Matches screen: yesterday, today, tomorrow only (Q1) | Product owner |
| 2026-10-22 | All times shown in Egypt time; `time` field ignored (provider time, 3 h earlier) (Q2) | Product owner |
| 2026-10-22 | Games play once per day; prediction/squad payloads come from `GET /games/:id` (Q4, Q5) | Product owner / verified |
| 2026-10-22 | `MatchEventsimages` = event icons; not used (app draws its own icons) (Q6) | Product owner |
| 2026-10-22 | Arabic typeface: Cairo (Q8) | Product owner |
| 2026-10-22 | Arabic UI uses Arabic-Indic digits (٠١٢٣); numbers set in Cairo in Arabic, Barlow Condensed in English (Q9) | Product owner |
| 2026-10-22 | Yellow/red cards: neutral shapes plus label, no off-palette colours (Q10) | Recommended, owner deferred |
| 2026-10-22 | App name "24/7 Sports" in both languages; ids `com.sports247.app` (Q12) | Product owner |
| 2026-10-22 | Git remote: `https://github.com/mhassan-19/24-7-sports.git`; `git init` at Phase 2 start (Q13) | Product owner |
| 2026-10-22 | Light theme: Bone page, white cards, Concrete for controls (was Concrete cards) | Proposed |
| 2026-10-22 | Featured hubs (مختارات) removed from Home for now | Product owner |
| 2026-10-21 | Mobile on Expo managed workflow with prebuild | Proposed |
| 2026-10-21 | Dark theme by default; desktop masthead scrolls away (primary logo is ~1.2:1) | Proposed |

## Open items, each with a recommendation

Going ahead with each recommendation unless you say otherwise.

| # | Item | Recommendation |
|:--|:--|:--|
| Q3 | Your status list (1 first half … 5 first extra time … 10/12 penalties) matches the **match phase** in `matchRoundInfo.event_id`, not `matchStatus`: in the data, `matchStatus` 1 is "لم تبدأ" (not started) and 5 is "انتهت" (finished). | Use `matchStatus` for the state (1 not started, 5 finished, anything else in play) and your list on `matchRoundInfo.event_id` for the live phase label and minute. Unknown values show the API's own Arabic `status` label. Backend to confirm in one line. |
| Q2b | One sample suggests `date` is UTC+3 all year: a Jan 2026 Premier League match kicked off 20:00 UK (22:00 Cairo) but `date` says 23:00. Egypt is UTC+2 from 30 Oct 2026 to late April. | Backend to confirm whether `date` follows Egypt winter time. Until then show `date` as-is, labelled Cairo time. Game fixtures use proper UTC (`match_datetime`) and are converted to Cairo time correctly. |
| Q4 | Guests identified by IP: Egyptian mobile networks put many users behind one shared public IP, so "once per day per IP" would let only the first person on that IP play. The app also can't see its own public IP without a third-party service. | Send a random device ID (UUID) as `user_identifier` for guests; it needs no backend change. If you prefer IP, the backend should read the request IP itself. |
| Q5b | `match-predict-games` / `team-squad-games` with 3/2/2 return 404, but `GET /games/:id` returns the full fixtures and players. | Use `GET /games/:id` for both. No stage ids needed. |
| N1 | Prediction answer body: Postman shows `predicted_team_id`, but the game offers home/draw/away and a draw has no team. | Backend confirms the body; expected `{ user_identifier, game_fixture_id, outcome }` with `home`/`draw`/`away`. |
| N2 | Squad game: the API lists positions and 30 players but not how many to pick per position. | Backend adds a required count per position (e.g. `positions[].count`) or confirms a fixed formation. |
| Q7 | TEST has no matches today or live (latest data is from early 2026), so live scores, the minute ticker and polling can't be checked there. | No backend work needed: build live states against recorded samples in tests, then verify on a real match day by pointing a development build at PROD read-only (GET only; the client blocks writes to PROD). |
| Q11 | The brand slash leans forward like "/". Arabic layouts mirror right-to-left, so it could flip to "\". | Keep "/" in both languages. It is part of the logo, and the logo never flips. |
| Q14 | Crash reporting: Sentry needs an account. Create a free one at sentry.io with your work email, add two projects (React web, React Native) and send the two DSN strings (like `https://abc@o123.ingest.sentry.io/456`). | Not needed for Phase 2. Set it up before the first Android release build (Phase 3); the apps read the DSN from env and stay off without it. |

Security notes for the backend team are in the API audit (token in the Postman file, debug mode
on TEST, exposed game answers).
