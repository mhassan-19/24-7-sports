# 24/7 Sports

Football-first sports platform: a React + Vite website (`apps/web`) and a React Native (Expo)
app for Android and iOS (`apps/mobile`; Android in Phase 3, iOS in Phase 4), on top of the existing
appkora backend.

## Quick start

Requirements: Node 22+ (tested on 24), Git. pnpm is pinned in `package.json`; run it through
corepack, which ships with Node (no global install needed):

```bash
corepack pnpm install
```

```bash
corepack pnpm dev:web
```

Open http://localhost:5173. Development talks to the **TEST** API.

If you prefer typing `pnpm` directly, run `corepack enable` once (may need an admin shell on
Windows) and drop the `corepack` prefix from every command below.

## Commands (repo root)

| Command | What it does |
|:--|:--|
| `corepack pnpm dev:web` | Website dev server on :5173 (TEST API) |
| `corepack pnpm dev:web:live` | Dev server on :5174 with **real data** from the production API, read-only (game answers are not sent) |
| `corepack pnpm build` | Production build of the website (PROD API) → `apps/web/dist` |
| `corepack pnpm --filter @sports247/web build:test` | Deployable build against the TEST API |
| `corepack pnpm typecheck` | TypeScript in every package |
| `corepack pnpm lint` | ESLint + stylelint (logical CSS properties enforced for RTL) |
| `corepack pnpm test` | Unit and component tests (recorded fixtures, no live API) |
| `corepack pnpm e2e` | Playwright smoke tests against the dev server and TEST API (uses the installed Edge on Windows, Chrome elsewhere) |
| `corepack pnpm record-fixtures` | Re-record API fixtures from TEST (GET only) |
| `corepack pnpm dev:mobile` | Expo dev server for the app (TEST API); `corepack pnpm android` builds and opens it on an emulator or phone |
| `corepack pnpm --filter @sports247/mobile bundle:android` | Bundle the app's JavaScript for Android (quick check, no SDK needed) |

The app needs the Android SDK (`ANDROID_HOME`) and JDK 17+ for native builds. Release builds,
environments and signing: [docs/phase-3/README.md](docs/phase-3/README.md).

## Environments

Switching environments needs no code change; the build mode picks the env file.

| File | Used by | API | English UI |
|:--|:--|:--|:--|
| `apps/web/.env.development` | `dev:web` | TEST `testv3.appkora.com` | on (to test LTR) |
| `apps/web/.env.live` | `dev:web:live` | PROD `v3.appkora.com`, read-only | on |
| `apps/web/.env.test` | `build:test` | TEST | on |
| `apps/web/.env.production` | `build` | PROD `v3.appkora.com` | off until the API serves English |

Put local overrides in `apps/web/.env.local` (git-ignored). Non-production builds refuse to send
writes (game answers) to the production host.

The app uses `apps/mobile/.env.development` (TEST) and `.env.production` (PROD), and the EAS
profiles in `apps/mobile/eas.json` (`development` and `preview` on TEST, `production` on PROD).

## Repository

```
apps/web/            Website (React 19, Vite, React Router, TanStack Query)
apps/mobile/         Android/iOS app (Expo SDK 58, React Native 0.88, expo-router)
packages/domain/     Sport-agnostic domain types and football rules
packages/api/        Typed API client + mappers (all API quirks live here); fixtures in test/
packages/data/       TanStack Query hooks shared by web and mobile
packages/i18n/       Arabic/English strings, Arabic-Indic digits, Egypt-time formatting
packages/tokens/     Design tokens and brand assets from the 247-sports-design skill
docs/                API docs + audit, Phase 1 plan and prototype, Phase 2 and 3 notes
```

See [CLAUDE.md](CLAUDE.md) for conventions and [docs/phase-2/README.md](docs/phase-2/README.md)
for what Phase 2 delivered, [docs/phase-3/README.md](docs/phase-3/README.md) for Phase 3.
