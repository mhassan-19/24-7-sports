# 3. Screens and states

## Shared state rules

Applied to every screen and every independently loaded section of a screen.

| State | Behaviour |
|:--|:--|
| Loading | Skeleton that matches the final layout (rows, cards, table). Shown after 300 ms so fast responses don't flicker. Header and tabs stay interactive. Pull-to-refresh on mobile, refresh on focus on web. |
| Empty | One line saying what is missing and, where useful, one action (e.g. "No matches tomorrow." + "See competitions"). Never a blank area. |
| Error | Inline block: what failed + **Retry**. A failing section never blanks the whole screen (Home widgets fail independently). 404 on an entity shows "This page doesn't exist" + link home. |
| Offline | Top banner: "You're offline. Showing saved data." Cached data stays readable (persisted query cache). Actions that need the network (submitting a game answer) are disabled with the reason. Banner clears on reconnect and stale queries refetch. |
| Live | Matches whose status is live poll every 30 s while visible (interval is a config value). Status chip: Pulse Orange dot + "مباشر / LIVE" + minute. |
| Guest vs logged-in | v1 is guest-only, so every screen has one access state. No screen shows locked or "sign in to…" content. |

## Screen list

"Web" covers desktop and mobile browsers. "App" is the React Native app on Android and iOS.

| Code | Screen | Content and data | Web vs app | Empty / specific states |
|:--|:--|:--|:--|:--|
| S01 | Home | Yesterday/Today/Tomorrow matches grouped by competition (F2), top stories (F30), table snippet and top scorers for a featured league (F14, F15), games promo (F33) | Web ≥1024 px: two columns (matches + side rail). App: single column, sections stacked. | Each section has its own empty/error. "No matches today" offers Tomorrow. |
| S02 | Matches | Day tabs (F2), one filter chip per competition playing that day (with crest, same order as the list), list grouped by competition, live rows first | Web: day tabs + chips. App: swipe between day tabs. | "No matches on this day." Filter with no results: "No matches in this competition on this day." + Clear filter. |
| S03 | Match centre | Header (F5), tabs Events (F6), Lineups (F7), Stats (F8), Head to head (F9), News (F10) | Web: lineups pitch beside subs list. App: pitch then subs below; tabs swipeable. | Not started: Events/Stats show "Starts [time]"; Lineups "Lineups not announced yet". `has_lineup: false` per team handled separately. |
| S04 | More (app only) | Links to Transfers, Games, Settings, About | Web has these in the top bar | — |
| S05 | Competitions | Region chips (F3), list of active competitions with crest and current season (F11), client-side filter box | Web: grid. App: list. | Filter with no results. |
| S06 | Competition | Header with season picker (F12). Tabs by type: League = Table (F14), Matches (F13), Stats (F15), Teams (F16), History (F19). Cup = Overview (F18, F20), Matches, Bracket (F17, only if data), Stats, Teams, History. | Web: table shows GF, GA, GD, form. App: compact table (P, GD, Pts, form) with horizontal scroll for full columns. | "Table not available for this competition" when `has_standing` is 0. Bracket tab hidden when empty. |
| S07 | Leaders list | Full scorers or assists list (F15) | Same layout | Empty list. |
| S08 | Team | Header (F21), tabs Matches (F22), Squad (F23), Stats (F24), Photos (F25, only if galleries exist) | Web: squad as a grid by position. App: sectioned list. | No upcoming matches: show last results only. |
| S09 | Player | Header with number, position, nationality, age, height (F26); Stats with competition/season picker (F27); Career (F28) | Web: stats grid 4 columns. App: 2 columns. | Stats 404 for a season → "No stats for this season." |
| S10 | Transfers | List: player, from → to (arrow follows reading direction), fee, contract type (F29), paged | Same | "No transfers recorded yet." |
| S11 | News | Paged feed (F30), lead story large | Web: 3-column grid. App: list, infinite scroll. | — |
| S12 | Article | Title, date, image, sanitised body, tags to teams/players, related (F31) | Web: 680 px reading column. App: native text, images full width. | Article 404. |
| S13 | Search | Search as you type in the header: results grouped by type (F32), arrow keys + Enter, "See all results" opens the full page | Web desktop: dropdown under the header field. Phones: the search icon opens a full-screen sheet over the current page. Full results page at `/search?q=` for Enter and shared links. | Prompt (< 2 chars), searching, no results, error. |
| S14 | Games | Game cards with type badge and Played state (F33) | Web: grid. App: list. | "No games running right now." Games with type `unknown` are hidden. |
| S15 | Guess game | Question, image, 4 choices, submit, result (F34) | Same | Already played: show result, no resubmit. Offline: submit disabled. |
| S16 | Prediction game | Fixtures with kick-off in Cairo time, pick home / draw / away per fixture, submit; fans' picks (%) shown after (F35) | Same | No fixtures. Locked fixture (`is_locked`) can't be picked. Already played today: show picks and fans' %. |
| S17 | Squad game | Pick players per position for the round, submit (F36) | Web: pitch + picker side by side. App: pitch, picker as bottom sheet. | No squad game this round. |
| S18 | Settings | Theme: Dark (default) / Light / System. Language (hidden at launch). About, app version, data source. | Web: page. App: More → Settings. | — |

## Intentional web/app differences (summary)

1. Navigation: top bar (web) vs bottom tabs + More (app).
2. Density: web shows wider tables and multi-column grids; app keeps one column and moves extra
   table columns behind horizontal scroll.
3. Search: inline dropdown (web) vs modal (app).
4. Gestures: swipe between tabs and pull-to-refresh on the app only.
5. Settings: the theme toggle is one click in the web top bar; in the app it lives in Settings.
6. SEO: web pages render semantic HTML with per-route titles and meta; the app does not need it.
