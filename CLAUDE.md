# 24/7 Sports

Football-first sports platform (designed for more sports later): a React + Vite website and a
React Native (Expo) app for Android and iOS, on top of an existing backend.

## Status

- Phase 0 and Phase 1 approved. **Phase 2 (website) delivered, waiting for approval**
  (`docs/phase-2/README.md`). Phase 3 (Android) has not started.
- Work in phases; stop at the end of each phase for explicit approval.
- Every open question goes to the user with a recommendation.

## Sources of truth

- Design: the `247-sports-design` skill. Only its colours, fonts and devices. No green, ever.
  Tokens in `packages/tokens/src/index.ts` are derived from it.
- API: `docs/api/API_ENDPOINTS.md`, `docs/api/twist-apis.postman.json`, and the verified status
  in `docs/api/API_AUDIT.md`. Build only features whose endpoint is marked ✅ there.
- Plan: `docs/phase-1/`. Phase 2 notes and deviations: `docs/phase-2/README.md`.

## Scope (v1)

- In: football core and football games on the appkora host. Guest-only (no login).
- Out: Twist account management (`account/*`), TPay, telco subscriptions/OTP, fitness, all
  legacy hosts (`*.twist-sports.com`, `twistmena.com`).
- Content is Arabic only; English UI is built but hidden in production (`VITE_FEATURE_ENGLISH`).

## Environments

| Env | API base URL | Web env file |
|:--|:--|:--|
| TEST (default in development) | `https://testv3.appkora.com/api` | `apps/web/.env.development`, `.env.test` |
| PROD | `https://v3.appkora.com/api` | `apps/web/.env.production`, `.env.live` (dev, read-only) |

- Never send write requests to PROD. The API client blocks non-GET requests to PROD in any
  non-production build. On TEST, GET freely; to learn a POST body, send an empty or invalid body
  and read the 422 (validation fails before anything is saved).
- CORS is open (`*`); PROD preflight does not allow POST, so writes go as form data.

## Commands (run from the repo root)

pnpm runs through corepack (no global install): prefix commands with `corepack`.

| Command | Purpose |
|:--|:--|
| `corepack pnpm install` | Install |
| `corepack pnpm dev:web` | Website dev server, http://localhost:5173 (TEST API) |
| `corepack pnpm dev:web:live` | Dev server on http://localhost:5174 reading **real PROD data** (read-only: writes blocked) |
| `corepack pnpm build` | Production build → `apps/web/dist` (PROD API) |
| `corepack pnpm --filter @sports247/web build:test` | Build against TEST |
| `corepack pnpm typecheck` / `lint` / `test` | Quality gates (Turborepo) |
| `corepack pnpm e2e` | Playwright smoke tests (local Edge/Chrome, TEST API, 2 workers) |
| `corepack pnpm record-fixtures` | Refresh `packages/api/test/fixtures` from TEST (GET only) |
| `node docs/phase-1/prototype/build.mjs` | Rebuild the Phase 1 prototype |

`.claude/launch.json` has `web` (dev, TEST), `web-live` (dev, PROD read-only, :5174), `web-preview`
(built app on :4174) and `prototype`.

TEST data is stale (fixtures end early 2026, no group tables); use `dev:web:live` to see real data.

## Folder structure

```
apps/web/src/
  app/        router (lazy routes under /:lang), layout (top bar, tab bar), providers
  pages/      one file per screen
  features/   match, competition, news, search (header combobox + phone sheet) components
  ui/         primitives, brand (logo, slash), states (QueryView, empty, error, skeleton), Seo
  lib/        locale (useFmt, paths), prefs (theme), season, guestId, useOnline
packages/
  domain/     clean types + football rules (status, phases, events)
  api/        client (errors, write guard, form posts), read.ts (lenient readers), mappers, sportsApi
  data/       TanStack Query hooks, keys, polling, retries
  i18n/       ar.json / en.json, digits, Egypt-time formatters
  tokens/     palette, semantic themes, type scale, logo assets
docs/         api/, phase-1/, phase-2/
```

## Conventions

- TypeScript everywhere. Shared logic in `packages/*`; UI is per platform.
- Routes live under `/:lang/football/...` so other sports can be added beside football.
- Layout with logical properties only (`margin-inline-start`, `inset-inline-*`,
  `text-align: start`); stylelint enforces it. Mirror directional icons only (`back`, `chevron`,
  `arrow`); never mirror logos, the slash device, the pitch or minute timelines.
- Never uppercase or letter-space Arabic. Arabic UI uses Arabic-Indic digits (`useFmt().n`,
  `.digits`) and Cairo for numbers; English uses Barlow Condensed with tabular figures.
- Counts in copy use `{{n}}` (localized number) with `count` for plural forms: `f.tn(key, count)`.
- Times are Egypt time: match `date` is shown as-is (`f.time`, `f.date`), ISO UTC via
  `f.instant` (Africa/Cairo); the API `time` field is ignored.
- Colours come from tokens (CSS variables injected from `@sports247/tokens`); results use W/D/L
  letters plus colour, never green/red. Light theme: Bone page, white cards, Concrete controls.
  Card icons are neutral shapes.
- Every query renders through `QueryView` (loading after 300 ms, error with retry, empty) and keeps
  cached data when a refetch fails.
- API strings render inside `<bdi>`; content stays as returned (Arabic).
- Games: payload from `GET /games/:id`, guest `user_identifier` = device UUID, one play per day;
  reveal correct answers only after submitting.
- API quirks stay inside `packages/api`; unit tests use recorded fixtures, never the live API.
- After each meaningful step run typecheck, lint, test and build, and fix failures first.
- Git remote: `https://github.com/mhassan-19/24-7-sports.git`. Commit and push only when asked.
