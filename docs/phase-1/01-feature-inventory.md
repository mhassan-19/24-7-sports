# 1. Feature inventory

Every feature below is backed by an endpoint verified on TEST (see
[API audit](../api/API_AUDIT.md)). Scope: football core and football games on the appkora host.
v1 has **no login** (account management is out of scope), so every feature is available to guests.

Screen codes are defined in [03-screens-and-states.md](03-screens-and-states.md).

## Built in v1

| # | Feature | Endpoint(s) | Screens |
|:--|:--|:--|:--|
| F1 | ~~Featured hubs~~ removed from Home on 2026-10-22 (product decision); see "Available but not used" | `GET /global-config` | — |
| F2 | Matches for yesterday, today, tomorrow | `GET /homeCalendar` | S01 Home, S02 Matches |
| F3 | Filter matches by region | `GET /services` (labels) + `services[]` on each match | S02 Matches, S05 Competitions |
| F4 | Live score refresh (polling) | re-fetch `GET /homeCalendar`, `GET /matchStatistics` | S01, S02, S03 |
| F5 | Match header: teams, score, status, venue, competition | `GET /matchStatistics?match_id` | S03 Match centre |
| F6 | Events timeline (goals, cards, subs, VAR, periods) | `GET /match_events?match_id` | S03 → Events |
| F7 | Lineups, formation, ratings, subs, manager | `GET /newLineup/:match_id` | S03 → Lineups |
| F8 | Team stats comparison | `GET /matchStatistics?match_id` | S03 → Stats |
| F9 | Recent meetings between the two teams | `GET /newLatest-matches-for-teams?match_id` | S03 → Head to head |
| F10 | News about the match | `GET /matchMedia?match_id` | S03 → News |
| F11 | Competitions directory grouped by region | `GET /activeTournaments`, `GET /services` | S05 Competitions |
| F12 | Competition overview, seasons, stages | `GET /tournaments/:id` | S06 Competition (header, season picker) |
| F13 | Fixtures and results (paged) | `GET /tournament/matches?tournament_id&season_id&page`, `GET /tournamentCalendar?tournament_id&season_id` | S06 → Matches |
| F14 | League table with last-5 form; named group tables for group competitions | `GET /teamsStanding?tournament_id&season_id`; groups: `GET /tournament/standing?tournament_id&season_id` (`group_stage[]`) | S06 → Table |
| F15 | Player leaders (scorers, assists, clean sheets, passes) | `GET /topLeaguePlayers?tournament_id&season_id&items_count`; full lists `GET /top-scorers`, `GET /top-assists` | S06 → Stats, S07 Leaders list |
| F16 | Teams in a competition | `GET /tournament-teams?tournament_id&season_id` | S06 → Teams |
| F17 | Knockout bracket (cups) | `GET /knockout-stage-bracket?tournament_id&season_id` | S06 → Bracket (only when the competition has one) |
| F18 | Cup stages and progress | `GET /stages?tournament_id`, `GET /tournament-progress?tournament_id&season_id`, `GET /results-and-matches?tournament_id&season_id` | S06 → Overview (cups) |
| F19 | Honours: history, most titles, last winner | `GET /tournament-history/:id`, `GET /tournament-most-last-winner?tournament_id` | S06 → History |
| F20 | Team of the week (image) | `GET /team-of-the-week?tournament_id&week` | S06 → Overview |
| F21 | Team profile | `GET /teams/:id` | S08 Team |
| F22 | Team fixtures (previous, today, next) | `GET /teamCalendar?team_id` | S08 → Matches |
| F23 | Squad by position | `GET /teams/:id/squad` | S08 → Squad |
| F24 | Team season stats, scoring by 15-minute interval | `GET /teamStatistics?team_id&tournament_id&season_id` | S08 → Stats |
| F25 | Team photo galleries | `GET /al-ahly/galleryList/:team_id`, `GET /teamGallery/:gallery_id` | S08 → Photos (shown only when the list is not empty) |
| F26 | Player profile | `GET /players/:id/details` | S09 Player |
| F27 | Player stats per competition and season | `GET /players/:id/statistics?tournament_id&season_id` | S09 → Stats |
| F28 | Player career by club | `GET /player-history-details/:id` | S09 → Career |
| F29 | Transfers | `GET /transferes?page` | S10 Transfers |
| F30 | News feed (paged) and top stories | `GET /media?page`, `GET /mixMedia` | S01 Home, S11 News |
| F31 | Article with tags and related articles | `GET /media/:id` | S12 Article |
| F32 | Search teams, players, competitions | `GET /full-search?keyword` | S13 Search |
| F33 | Games list | `GET /games` | S14 Games, S01 Home (promo) |
| F34 | Guess game (choose the answer) | `GET /games/:id?user_identifier`, `POST /guess-games/:id/answer` | S15 Guess game |
| F35 | Match prediction game (home/draw/away per fixture, fans' picks after answering) | `GET /games/:id` (fixtures, outcomes, stats), `POST /match-predict-games/:id/answer` (id from `answer_endpoint`) | S16 Prediction game |
| F36 | Team-of-the-round squad game | `GET /games/:id` (positions, players), `POST /team-squad-games/:id/answer` | S17 Squad game |
| F37 | Theme (dark, light, system) and language preference | client only | S18 Settings, header toggle |

## Available but not used in v1

| Endpoint | Reason |
|:--|:--|
| `GET /global-config` | Featured hubs (Al Ahly, Club World Cup, AFCON, Egypt, World Cup). Removed from Home on 2026-10-22; mapper (`mapHubs`) and hook (`useFeaturedHubs`) kept. If it returns, ask the backend for a `type` per entry instead of the hard-coded team/competition list. |
| `GET /matches` | Ignores every filter tried (date, tournament, team). Not useful until filters are documented. |
| `GET /matches_dates`, `GET /tournament/matches_dates` | Return days that have matches, but no endpoint returns the matches for an arbitrary day. Becomes the calendar strip once a by-date endpoint exists. |
| `GET /calendar` | Same yesterday/today/tomorrow shape as `homeCalendar` with tournament filters; `tournamentCalendar` covers the competition case. |
| `GET /goalMatchEvents` | Returned the full event list in TEST, identical to `match_events`. |
| `GET /MatchEventsimages` | Event icons (confirmed), not photos. The app draws its own icons. |
| `GET /match-predict-games`, `GET /team-squad-games` | Stage-filtered lists; `GET /games/:id` already returns the full game. |
| `GET /standing` | Same flat table as `teamsStanding`. |
| `GET /matchesGroupdByDates` | Returned empty data with a round label in TEST. |
| `GET /tournament-players-stat` | Cup player leaders (Club World Cup). Candidate for cup Stats once data exists in TEST. |
| `GET /al-ahly/matches`, `GET /al-ahly/teams/:id/squad` | Duplicates of `teamCalendar` and `teams/:id/squad` for team 1. |
| `GET /simple_teams`, `GET /seasons`, `GET /global-settings`, `GET /games/participate`, `GET /guess-games` | Data looks incomplete or purpose unclear (e.g. `seasons` returns cup names as season titles). |

## Documented but not available (not built)

Favourites, `/sports`, `/userPoints`, `/mostSearched`, per-type search, all comparison endpoints,
`whoWinWho`, `tournament/tree`, `otherCalendar`, `players/:id`, player season endpoints and
social login return 404. Features that would need them are in
[06-recommended-not-built.md](06-recommended-not-built.md).
