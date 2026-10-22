# 4. Design tokens and component library

Source of truth: the `247-sports-design` skill (24/7 Sports Brand Identity Guidelines v1.0).
Nothing here adds a colour or typeface outside it, except the Arabic typeface, which the skill
says to choose and flag (see below). These tokens become `packages/tokens` in Phase 2 and feed
both CSS variables (web) and a typed theme object (React Native).

## Colour

Brand palette (fixed): Midnight `#141416`, Bone `#F5F3EF`, Pulse Orange `#FF5A1F`,
Electric Blue `#2B4BFF`, Graphite `#2A2C31`, Steel `#8B8F96`, Concrete `#E4E1DA`.
Working colours (text/UI only): Orange Ink `#C2410C`, Body `#4A4C52`, Muted `#6B6E75`,
Mist `#B9BBC0`, Line `#CFCBC3`, Line Dark `#3A3C42`, Blue Tint `#9FB0FF`.

### Semantic tokens

Dark is the default theme (the brand's natural mode); light uses Bone, never pure white.

| Token | Dark | Light | Use | Contrast check |
|:--|:--|:--|:--|:--|
| `bg` | Midnight | Bone | Page background | — |
| `surface` | Graphite | White | Cards, match groups, tables, panels | — |
| `surface-2` | Graphite | Concrete | Controls and placeholders: tab track, search field, select, crest chip, skeleton, image placeholder | — |
| `surface-sel` | Midnight | White | Selected segment inside a `surface-2` track | — |
| `line` | Line Dark | Line | Dividers, input borders | non-text |
| `text` | Bone | Midnight | Primary text | 16.6 / 16.6 on bg; 12.6 / 18.4 on surface |
| `text-2` | Mist | Body | Secondary text on bg **and** surface | 9.6 / 7.7 on bg; 7.2 / 8.6 on surface |
| `text-3` | Steel | Muted | Captions on `bg` (dark) or `bg`/`surface` (light); never on Graphite | 5.7 / 4.6 on bg; 5.1 on white |
| `accent` | Pulse Orange | Pulse Orange | Fills: primary button, live dot, active tab bar, slash | non-text on light |
| `on-accent` | Midnight | Midnight | Text on `accent` | 5.9 |
| `accent-text` | Pulse Orange | Orange Ink | Links, eyebrows, active nav label | 5.9 / 4.7 |
| `data` | Blue Tint | Electric Blue | Secondary data emphasis (text, thin marks) | ≥ 5.3 |
| `focus` | Pulse Orange | Midnight | 2 px focus ring + 2 px offset | ≥ 3:1 |
| `scrim` | Midnight 60% | Midnight 40% | Behind sheets and modals; over photos under text | — |

**Light theme, revised 2026-10-22.** The first proposal used Concrete cards on Bone. The two are
close in value, so cards looked muddy and Muted captions failed contrast on Concrete (3.9:1). Cards
are now white on the Bone page (white is an approved brand background; the page itself stays
Bone, never white), and Concrete moves to controls and placeholders. The prototype toolbar keeps
a White/Concrete switch for comparison.

Rules carried from the brand:
- **No green and no red, anywhere.** Results use letters plus colour: **W** Pulse Orange fill
  with Midnight letter, **D** `surface` fill with `text` letter, **L** Steel fill with Midnight
  letter.
- Never Pulse Orange text on Bone, never Bone on Pulse Orange (2.8:1).
- Stat comparisons: home team in Pulse Orange, away team in `text` (Bone or Midnight). Third
  series (rare) in Electric Blue / Blue Tint.
- Team colours appear only inside the team crest.

## Typography

| Token | Latin (EN) | Arabic (AR) | Size / line-height (app, web ≥1024 px) |
|:--|:--|:--|:--|
| `display` | Barlow Condensed 800, uppercase | Cairo 800 | 40 / 0.95 (56 web) |
| `headline` | Barlow Condensed 700, uppercase | Cairo 700 | 28 / 1.0 (36 web) |
| `subhead` | Barlow Condensed 600, uppercase | Cairo 600 | 20 / 1.2 |
| `body` | Barlow 400 | Cairo 400 | 16 / 1.45 (AR 1.6) |
| `label` | Barlow 600 | Cairo 600 | 14 / 1.3 |
| `eyebrow` | Barlow 600, caps, 0.15em tracking | Cairo 600, no tracking | 12 / 1.2 |
| `score-xl` / `score-md` / `score-sm` | Barlow Condensed 800, tabular figures | Cairo 800, Arabic-Indic digits | 56 / 24 / 18 |

- **Arabic typeface: Cairo** (Google Fonts, 400–800), confirmed 2026-10-22. Not yet part of the
  written brand guidelines.
- Arabic text is never uppercased or letter-spaced (both break the script).
- **Digits**: the Arabic UI uses Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩), confirmed 2026-10-22.
  Formatting goes through `Intl` with `ar-EG`; numeric strings from the API (formation "4-2-3-1",
  minutes, seasons) pass through a digit converter. Barlow Condensed has no Arabic-Indic digits,
  so in Arabic, scores and stats are set in Cairo 800. English keeps Barlow Condensed with
  tabular figures. Prices from the API (e.g. "1.1M €") are shown as returned.
- Fonts: web self-hosts via `@fontsource` packages; the app loads them with `expo-font`.

## Space, shape, motion

- Spacing scale (px): 4, 8, 12, 16, 24, 32, 48, 64. Side gutter 16 (app) / 24–32 (web).
- Radius: `card` 16, `small` 12 (chips and buttons; a 24 px chip with radius 12 is a pill).
- No shadows. Separation comes from `surface` vs `bg`. Sheets and modals use `scrim`.
- Motion: 150 ms (state changes), 250 ms (sheets, tab content), ease-out. Live score changes
  flash the score once. All motion off under reduced-motion settings.
- Touch targets ≥ 44 × 44 pt (app) and ≥ 40 × 40 px (web).

## Brand elements in the UI

- **Logo**: web top bar uses `primary-signature-reversed` (dark) or `primary-signature`
  (light), 120–160 px wide. Below 120 px (phones) switch to the logomark, ≥ 48 px. One logo per
  screen. App icon `icon-midnight`; favicon `favicon.svg`; splash Midnight with the reversed
  signature logo.
- **Slash device**: separates the two scores in the match centre and appears as a small marker
  before section titles. Always 60°, leaning forward, never mirrored in RTL (it is a brand mark,
  like the logo).
- **Cards (yellow/red)**: no off-palette colours. Yellow card = outlined rectangle, red card =
  solid rectangle in `text` colour, always with the event name next to it.
- **Slash stripes**: one band per layout at most (e.g. the games promo).
- **Statement orange**: the Home games promo is the one full Pulse Orange panel.
- **Live**: Pulse Orange dot + the word (مباشر / LIVE) + minute. Never colour alone.

## RTL / LTR

- `dir` is set from the locale on `<html>` (web) and via `I18nManager` (app). Arabic is RTL.
- Layout uses logical properties only: `margin-inline-start`, `padding-inline`, `inset-inline-*`,
  `text-align: start` (web, enforced by a stylelint rule); `start`/`end` style props and
  `marginStart`/`marginEnd` (app). No `left`/`right` in components.
- Mirror directional icons (back, forward, chevrons, the transfer arrow). Never mirror logos,
  the slash device, play/clock/search icons, or the pitch.
- The home team sits at the reading start. The score block is three flex items (home score,
  separator, away score), so each number stays next to its team in both directions.
- API strings are wrapped in `<bdi>` (web) / isolated text runs (app) so Latin names inside
  Arabic text don't scramble punctuation.
- Stat bars grow from the reading start; tables start with the position column at the start.

## Component library

Shared names and props across web (`packages/ui-web`) and app (`packages/ui-native`); both read
`packages/tokens`. The prototype's **Components** screen shows each one in both themes and both
directions.

| Group | Components |
|:--|:--|
| Brand | `Logo` (layout: primary/logomark; version picked from theme), `SlashDivider`, `StripeBand` |
| Type and icons | `Text` (variant = typography token), `Icon` (`mirrorInRtl` flag), `Bdi` |
| Controls | `Button` (primary = orange fill + Midnight label, secondary = outline, ghost), `IconButton`, `SegmentedTabs` (day tabs), `EntityTabs`, `FilterChip`, `SeasonPicker`, `SearchField`, `ThemeSwitch` |
| Football data | `Crest` (logo in a neutral chip, initials fallback), `PlayerAvatar`, `StatusChip` (not started / live / finished / other), `ScoreBlock`, `MatchRow`, `MatchHeader`, `CompetitionGroup`, `EventTimelineItem`, `PitchLineup`, `SubsList`, `StatCompareBar`, `StandingsTable`, `FormChips`, `LeaderRow`, `SquadSection`, `PlayerStatGrid`, `TransferRow` |
| Content | `NewsCard` (lead, compact), `ArticleBody` (sanitised HTML → semantic text), `TagChip`, `GameCard`, `ChoiceButton`, `ResultPanel` |
| Feedback | `Skeleton` (row, card, table), `EmptyState`, `ErrorState` (with retry), `OfflineBanner`, `Toast`, `LiveDot` |
| Layout | `AppShell` (`TopBar` web / `BottomTabs` app), `PageHeader`, `Section` (eyebrow + title + "See all"), `Grid`, `Sheet` (app) |

### Key component specs

- **MatchRow**: crest + name for each team at start and end, `ScoreBlock` or kick-off time in
  the middle, `StatusChip` under the score. Live rows show the minute. Whole row is one link
  (accessible name: "Brighton 1, Bournemouth 1, finished").
- **StandingsTable**: sticky first column (position + crest + name). Zones (e.g. top four) are
  marked by a numbered key, not by colour alone.
- **PitchLineup**: vertical pitch drawn with `line` strokes on `surface`; players as numbered
  discs (Midnight/Bone) with name below, rating chip, and event icons (goal, card, sub minute).
  Built from the API's `pitch.{goal,defence,midp1..3,attack}` rows.
- **StatCompareBar**: label centred, values at both ends, two bars meeting in the middle
  (home Pulse Orange, away `text`), widths proportional to share.
- **Crest**: the API logo URL inside a 1:1 `surface` chip; on load error, initials from
  `short_name` (or the first letter of the Arabic name).
