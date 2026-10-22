# 5. Technical plan

> Phase 2 adjusted a few details (no `ui-web` or `config` packages, no zod, pnpm via corepack).
> See [../phase-2/README.md](../phase-2/README.md#changes-from-the-phase-1-plan).

## Repository structure

A pnpm workspace with Turborepo for task orchestration and caching.

```
24-7-sports/
├─ apps/
│  ├─ web/             React + Vite + TypeScript SPA (React Router)
│  └─ mobile/          Expo (React Native) + Expo Router + TypeScript, Android and iOS
├─ packages/
│  ├─ api/             Typed HTTP client: env-driven base URL, envelope unwrapping, error model,
│  │                   zod schemas → domain models. No React.
│  ├─ domain/          Sport-agnostic types (Match, Team, Player, Competition, Article, Game) and
│  │                   football mappers (status codes, lineup rows, W/D/L).
│  ├─ data/            TanStack Query hooks, query keys, cache times, polling rules. Shared by
│  │                   web and mobile.
│  ├─ i18n/            i18next resources (ar.json, en.json), Intl formatters, direction helpers.
│  ├─ tokens/          Design tokens (JSON source) → CSS variables for web and a typed theme for
│  │                   React Native. Brand SVGs and fonts list.
│  ├─ ui-web/          React DOM components (CSS Modules, logical properties only).
│  ├─ ui-native/       React Native components with the same names and props.
│  └─ config/          Shared tsconfig, ESLint, Prettier, stylelint presets.
├─ docs/               API docs and audit, phase plans, prototype
└─ CLAUDE.md
```

Shared: API client, domain types, data hooks, i18n strings and formatters, design tokens.
Not shared: UI components (DOM vs native primitives differ too much; sharing names and props
keeps screens parallel without a cross-platform UI layer's cost).

pnpm needs `node-linker=hoisted` for React Native/Metro compatibility in the monorepo; this is set
in `.npmrc` from the start.

## Mobile: Expo (managed, with prebuild)

Expo is the right fit; nothing in scope needs the bare workflow.
- In-scope features need only networking, fonts, images, deep links and local storage, all of
  which Expo covers. No payments, background services or custom native SDKs.
- **EAS Build compiles iOS in the cloud.** This machine is Windows, so without EAS the iOS
  phases would be blocked on a Mac.
- Expo Router gives file-based routes that mirror the web routes and deep links for free.
- Continuous Native Generation (`expo prebuild`) keeps native folders generated, so app id,
  icons, splash and permissions live in `app.config.ts` and stay reviewable.
- EAS Update allows JS-only fixes without a store release.

If a future requirement needs a native module Expo lacks, a config plugin or a development build
handles it without leaving Expo.

## State management

| Kind | Tool | Notes |
|:--|:--|:--|
| Server state | TanStack Query | Caching, retries, pagination (`useInfiniteQuery`), polling, offline persistence. Same hooks on web and mobile. |
| Client state | Zustand (persisted) | Theme, locale, games device ID, last-viewed competition. Web persists to `localStorage`, mobile to AsyncStorage. |
| URL state | Router | Entity ids, active tab, day, region filter, search query. Shareable on web. |

No Redux: there is no complex client-side domain state.

## Data fetching and caching

- **Client**: `fetch` wrapper with base URL from env, `Accept: application/json`, 15 s timeout
  (AbortController), and one error type `ApiError { kind: network | timeout | http | validation |
  parse, status, fieldErrors }`. Laravel debug bodies are never shown to users.
- **Normalisation**: one function per endpoint unwraps the envelope style (Laravel paginated,
  games, plain) and parses with zod in lenient mode. Unknown `matchStatus` values map to
  `unknown` instead of throwing. Typos stay inside `packages/api` (`/transferes`, `assissts`,
  `topCleanSheats`) and never leak into domain types.
- **Cache times**:

  | Data | staleTime | Refetch |
  |:--|:--|:--|
  | Live match, match day lists with a live match | 15 s | every 30 s while visible |
  | Match day lists, match centre (not live) | 60 s | on focus |
  | Standings, leaders | 5 min | on focus |
  | Team, player, competition metadata | 30 min | — |
  | News list | 2 min | on focus |
  | Transfers, games list | 10 min | on focus |

- **Polling** stops when the tab is hidden or the app is backgrounded (focus manager wired to
  `visibilitychange` on web, `AppState` on mobile).
- **Retries**: 2 with backoff for network errors and 5xx; none for 4xx.
- **Offline**: the query cache persists (web `localStorage`, mobile AsyncStorage, 24 h max age);
  online state from `navigator.onLine` / NetInfo drives the offline banner and TanStack's
  online manager. Mutations (game answers) are blocked offline.
- **Images**: lazy `<img>` with explicit sizes on web; `expo-image` with disk cache on mobile.
- **Article HTML**: sanitised with DOMPurify on web; on mobile parsed into a whitelist of blocks
  (paragraph, heading, list, image, link).

## Environments

| Variable (web / mobile) | development | production |
|:--|:--|:--|
| `VITE_API_BASE_URL` / `EXPO_PUBLIC_API_BASE_URL` | `https://testv3.appkora.com/api` | `https://v3.appkora.com/api` |
| `VITE_APP_ENV` / `EXPO_PUBLIC_APP_ENV` | `test` | `production` |
| `VITE_FEATURE_ENGLISH` / `EXPO_PUBLIC_FEATURE_ENGLISH` | `true` (to test LTR) | `false` |
| `VITE_LIVE_POLL_MS` / `EXPO_PUBLIC_LIVE_POLL_MS` | `30000` | `30000` |

- Web: `.env.development` and `.env.production` committed with public values only;
  `.env.local` for overrides (git-ignored). Mobile: EAS build profiles `development` and
  `preview` → TEST, `production` → PROD, read in `app.config.ts`.
- **Write guard**: in any non-production build, the API client refuses non-GET requests when the
  base URL host is the production host. Switching environments needs no code change.

## i18n and direction

- i18next + react-i18next on both platforms, resources in `packages/i18n`. Arabic plural rules
  come from `Intl.PluralRules`.
- Formatting through `Intl` with `ar-EG` (Arabic-Indic digits) / `en-GB` for dates, times and
  numbers; a small converter handles digits inside API strings (formations, minutes, seasons).
- Time: all times are shown in Egypt time. Match `date` is already Egypt wall-clock time and is
  shown as-is; ISO UTC timestamps (game fixtures) are formatted with `timeZone: 'Africa/Cairo'`.
  The `time` field is ignored.
- Web sets `<html lang dir>` on locale change (runtime switch, no reload). Mobile uses
  `I18nManager` with `supportsRTL`; switching between RTL and LTR at runtime needs an app reload
  (`expo-updates` `reloadAsync`), which the Settings screen explains.
- English is built, tested and hidden behind the feature flag until the API serves English.
- API content is rendered as returned (Arabic) inside isolated runs.

## Authentication

Not in v1: Twist account management is out of scope and no other account API exists.
`packages/api` keeps a no-op auth hook (`getAccessToken`, `onUnauthorized`) so a future account
API plugs in without touching screens. When it arrives: tokens in `expo-secure-store` on mobile;
on web, short-lived access token in memory with refresh, pending what the backend supports.

**Games identity**: one play per game per day. Recommended: a random UUID generated on first
play, stored on the device, sent as `user_identifier` (IP-based identity would collide on shared
carrier IPs; see README Q4). One `getGuestIdentifier()` function, so switching approach is a
one-line change. Game payloads come from `GET /games/:id`; answers go to the `answer_endpoint`
it returns.

## Error handling

- Route-level error boundary (web) / screen-level (mobile) with "This page doesn't exist" for
  404s and a retry view for others.
- Section-level boundaries on composite screens (Home, Match centre) so one failing endpoint
  doesn't blank the page.
- `ApiError` → localized message by `kind`. 422 `errors` map onto form fields (game submit).
- Crash and error reporting with Sentry: wired in Phase 2 behind `*_SENTRY_DSN` (off when
  empty); DSNs needed before the first Android release build in Phase 3.

## Web specifics: SEO, accessibility, performance

- Path routes with locale prefix, per-route `<title>`, description, canonical and Open Graph
  tags; semantic landmarks (`header`, `nav`, `main`, `article`, tables with `th scope`).
- `robots.txt` and a `sitemap.xml` of static routes at build; entity pages discoverable through
  links. Prerendering the static routes is an option if search traffic matters at launch.
- WCAG 2.2 AA: contrast pairs from the brand table, visible focus, keyboard tabs (arrow keys),
  skip link, `aria-live` for score changes, reduced motion respected.
- Route-level code splitting; fonts self-hosted with `font-display: swap`.

## Quality gates (every step)

| Check | Tool |
|:--|:--|
| Typecheck | `tsc --noEmit` per package (Turborepo) |
| Lint | ESLint (typescript-eslint, react-hooks, jsx-a11y), stylelint with a logical-properties rule, Prettier |
| Unit | Vitest: API normalisation against recorded TEST fixtures, formatters, status mapping |
| Components | React Testing Library (web), React Native Testing Library (mobile) |
| E2E web | Playwright smoke: Home → Match → Team → Player in `ar`/`en` × dark/light, with axe checks |
| E2E mobile | Maestro flows on the Android emulator (Phase 3) |
| Contract | Optional nightly job: GET the endpoints we use on TEST and validate schemas |

Unit and component tests never call the live API.

## Implementation phases

| Phase | Steps | Done when |
|:--|:--|:--|
| 2 Web | 2.1 Monorepo, tooling, env, `git init` with remote `github.com/mhassan-19/24-7-sports` · 2.2 tokens + fonts + `ui-web` primitives · 2.3 `api` + `domain` + fixtures + tests · 2.4 `i18n` · 2.5 shell: routes, nav, theme, locale, boundaries, offline · 2.6 screens: Home, Matches, Match centre, Competition, Team, Player, News, Article, Transfers, Search, Games, Settings · 2.7 SEO, a11y, performance pass · 2.8 tests, README | Builds, typecheck/lint/tests pass, Playwright smoke green in both locales and themes |
| 3 Android | 3.1 Expo app in the monorepo, `ui-native` primitives, routes · 3.2 screens · 3.3 app id, adaptive icon, splash, permissions (INTERNET only), RTL flags · 3.4 emulator verification (RTL/LTR, themes, games) · 3.5 EAS release profile, signing, AAB | Release AAB builds; Maestro flows pass |
| 4 iOS | 4.1 bundle id, icons, splash, safe areas, swipe-back, fonts, RTL · 4.2 EAS iOS build, TestFlight · 4.3 store-readiness checklist | TestFlight build installs; your on-device checklist passes |

## Risks

| Risk | Impact | Mitigation |
|:--|:--|:--|
| No "matches by date" endpoint | Matches limited to yesterday/today/tomorrow (accepted for v1) | Calendar strip is designed and can ship once a date filter exists |
| `date` may not follow Egypt winter time | Kick-offs from 30 Oct to late April could show 1 h late | Backend to confirm (README Q2b); one formatting function to fix if needed |
| Arabic-only content | English can't launch | Feature flag; backend appears to store translations (JSON titles) |
| Inconsistent API (3 envelopes, typos, unknown status codes, timezone) | Parsing bugs | Normalisation layer, lenient schemas, recorded fixtures, optional nightly contract check |
| TEST data is stale (no current or live fixtures) | Live states hard to verify | Ask backend to seed live fixtures on TEST; component tests with fixtures |
| Games identity and exposed answers | Cheating, resettable IDs | Device UUID (Q4); recommend server-side answer checks (R14) |
| Polling load for live scores | Backend load at peak | 30 s interval, only while visible; ask for cache headers |
| RTL ⇄ LTR switch on mobile needs a reload | Minor UX cost | Explain in Settings; English hidden at launch anyway |
| iOS builds need macOS | Phase 4 blocked locally | EAS Build cloud; you need an Apple Developer account |
| Arabic face not in the written brand guidelines | Brand owner may revise later | Cairo confirmed by product owner; fonts are one token to change |
