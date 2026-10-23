# 24/7 Sports

Football-first sports platform (designed for more sports later): a React + Vite website and a
React Native (Expo) app for Android and iOS, on top of an existing backend.

## Status

- Phases 0–3 approved (website in `apps/web`, Android in `apps/mobile`, approved 23 Oct 2026).
  Phase 4 (iOS) has not started.
- Work in phases; stop at the end of each phase for explicit approval.
- Every open question goes to the user with a recommendation.

## Sources of truth

- Design: the `247-sports-design` skill. Only its colours, fonts and devices. No green, ever.
  Tokens in `packages/tokens/src/index.ts` are derived from it.
- API: `docs/api/API_ENDPOINTS.md`, `docs/api/twist-apis.postman.json`, and the verified status
  in `docs/api/API_AUDIT.md`. Build only features whose endpoint is marked ✅ there.
- Plan: `docs/phase-1/`. Notes and deviations: `docs/phase-2/README.md` (web),
  `docs/phase-3/README.md` (Android).

## Scope (v1)

- In: football core and football games on the appkora host. Guest-only (no login).
- Out: Twist account management (`account/*`), TPay, telco subscriptions/OTP, fitness, all
  legacy hosts (`*.twist-sports.com`, `twistmena.com`).
- Content is Arabic only; English UI is built but hidden in production (`VITE_FEATURE_ENGLISH`,
  `EXPO_PUBLIC_FEATURE_ENGLISH`).

## Environments

| Env | API base URL | Web env file | Mobile |
|:--|:--|:--|:--|
| TEST (default in development) | `https://testv3.appkora.com/api` | `apps/web/.env.development`, `.env.test` | `apps/mobile/.env.development`; EAS `development`, `preview` |
| PROD | `https://v3.appkora.com/api` | `apps/web/.env.production`, `.env.live` (dev, read-only) | `apps/mobile/.env.production`; EAS `production` |

- Mobile reads `EXPO_PUBLIC_*` at build time; variables set in the shell or by EAS win over the
  `.env.*` files. A local release build without them uses `.env.production` (PROD, writes allowed),
  so build test APKs with the TEST variables set, or with `EXPO_PUBLIC_READ_ONLY=true` for real
  data without writes (EAS `preview-live`; see `docs/phase-3/README.md`).

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
| `corepack pnpm dev:mobile` | Expo dev server for the app (TEST API) |
| `corepack pnpm --filter @sports247/mobile prebuild` | Regenerate `apps/mobile/android` from `app.config.ts` (never edit `android/` by hand) |
| `corepack pnpm --filter @sports247/mobile bundle:android` | Bundle the Android JS only (fast Metro check) |
| `apps/mobile/android/gradlew app:assembleRelease` | Local release APK (see `docs/phase-3/README.md` for env, ABIs, signing) |

`.claude/launch.json` has `web` (dev, TEST), `web-live` (dev, PROD read-only, :5174), `web-preview`
(built app on :4174) and `prototype`.

Android tooling on this machine: SDK at `%LOCALAPPDATA%\Android\Sdk` (set `ANDROID_HOME` per
command), JDK 25 (Gradle 9.4 supports it), emulator AVD `sports247_api34`.

TEST data is stale (fixtures end early 2026, no group tables); use `dev:web:live` to see real data.

## Folder structure

```
apps/web/src/
  app/        router (lazy routes under /:lang), layout (top bar, tab bar), providers
  pages/      one file per screen
  features/   match, competition, news, search (header combobox + phone sheet) components
  ui/         primitives, brand (logo, slash), states (QueryView, empty, error, skeleton), Seo
  lib/        locale (useFmt, paths), prefs (theme), season, guestId, useOnline
apps/mobile/            Expo SDK 58 + expo-router (Android now, iOS in Phase 4)
  app/        file routes: (tabs)/ home, matches, competitions, news, more; football/…, news/[id],
              games/, search (modal), settings
  src/        ui/ (Text, Icon, primitives, states, brand), features/ (match, competition, news),
              lib/ (locale, prefs, theme, misc), providers, polyfills, test/
  plugins/    config plugins (release signing)
packages/
  domain/     clean types + football rules (status, phases, events)
  api/        client (errors, write guard, form posts), read.ts (lenient readers), mappers, sportsApi
  data/       TanStack Query hooks, keys, polling, retries
  i18n/       ar.json / en.json, digits, Egypt-time formatters
  tokens/     palette, semantic themes, type scale, logo assets
docs/         api/, phase-1/, phase-2/, phase-3/
```

## Conventions

- TypeScript everywhere. Shared logic in `packages/*`; UI is per platform.
- Routes live under `/:lang/football/...` so other sports can be added beside football.
- Mobile mirrors the web: same hooks, `useFmt`, `paths` (without the `/:lang` prefix) and
  `QueryView`; RN layout follows `I18nManager` (Arabic builds start RTL via `forcesRTL`). Pitch,
  minute charts and the slash device set `direction: 'ltr'`.
- Layout with logical properties only (`margin-inline-start`, `inset-inline-*`,
  `text-align: start`); stylelint enforces it. Mirror directional icons only (`back`, `chevron`,
  `arrow`); never mirror logos, the slash device, the pitch or minute timelines.
- Never uppercase or letter-space Arabic. Arabic UI uses Arabic-Indic digits (`useFmt().n`,
  `.digits`) and Cairo for numbers; English uses Barlow Condensed with tabular figures.
- Counts in copy use `{{n}}` (localized number) with `count` for plural forms: `f.tn(key, count)`.
- Times are Egypt time. API dates are a fixed UTC+3 (Saudi time); `egyptDateTime` in
  `packages/api` converts them to Cairo wall time (UTC+2 in winter), shown with `f.time`/`f.date`.
  ISO UTC values use `f.instant` (Africa/Cairo). The API `time` field is ignored.
- Colours come from tokens (CSS variables injected from `@sports247/tokens`); results use W/D/L
  letters plus colour, never green/red. Light theme: Bone page, white cards, Concrete controls.
  Card icons are neutral shapes.
- Every query renders through `QueryView` (loading after 300 ms, error with retry, empty) and keeps
  cached data when a refetch fails.
- API strings render inside `<bdi>`; content stays as returned (Arabic).
- Games: payload from `GET /games/:id`, guest `user_identifier` = device UUID, one play per day;
  reveal correct answers only after submitting.
- API quirks stay inside `packages/api`; unit tests use recorded fixtures, never the live API.
- Live minute: the API never sends it. Use `useLiveMinute(match)` (clock from
  `matchRoundInfo.created_at`, fixed UTC+3); the match page merges the clock from the day list.
- After each meaningful step run typecheck, lint, test and build, and fix failures first.
- Git remote: `https://github.com/mhassan-19/24-7-sports.git`. Commit and push only when asked.
