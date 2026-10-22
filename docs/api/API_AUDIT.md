# API audit (TEST environment)

Verified on 2026-10-21 against `https://testv3.appkora.com/api` with **GET requests only**.
POST routes were checked by sending a GET: Laravel answers `405 Method Not Allowed` when the
route exists, so no handler ran and nothing was written. Production was only touched with GETs
to confirm that a few missing routes are missing there too.

Sources compared: [`API_ENDPOINTS.md`](API_ENDPOINTS.md) (catalogue of what the old Twist
front end calls) and [`twist-apis.postman.json`](twist-apis.postman.json) (mostly fitness and
account endpoints). Neither documents request parameters or response shapes; the shapes below
come from live responses.

## Scope decisions (from the product owner, 2026-10-21)

- In scope for v1: **football core** and **football games** on the appkora host.
- Out of scope for now: Twist account management (all `account/*` auth and profile routes),
  TPay, telco subscriptions/OTP, fitness, and every non-appkora host (legacy Twist API, squash,
  Melouk, header enrichment, social login host).
- Content language: **Arabic only for now**. English UI stays built and tested but hidden.

## Conventions observed

| Topic | What the API does |
|:--|:--|
| Envelope | `{ data, message, status }`. `message` spelling varies ("Retreived", "Retrived"). `full-search` returns only `{ data }`. Games use `{ games, meta, status }` and `{ game, hints, choices, is_played, status }`. |
| Pagination A (Laravel) | `data.data[]`, `data.meta{current_page,last_page,per_page,total}`, `data.links{next,prev}`; request with `?page=N`. Used by `tournaments`, `matches`, `tournament/matches`, `media`, `transferes`. |
| Pagination B (games) | `games[]` + `meta{total_items,items_per_page,current_page,last_page}`. Also `services`. |
| Unpaginated | Plain `data[]`. Some are large (`top-scorers` returned 249 rows, `activeTournaments` 79). |
| Validation error | `422 { message, errors: { field: [msg] } }` |
| Auth error | `401 { status, message }` (out of scope for v1, recorded for later) |
| Not found / server error | `404` / `500` return Laravel debug output with stack trace and server paths (debug mode is on in TEST). |
| Language | Content is Arabic. `Accept-Language`, `?lang=`, `?locale=`, `lang` and `X-Localization` headers have no effect. English exists only in team `short_name`, stage `name_en`, `services[].name_en`, and a JSON `title` inside `tournament-progress` (suggests the DB stores translations). |
| Match status | `matchStatus` number + Arabic `status` label. Seen: `1` = not started ("لم تبدأ"), `5` = finished ("انتهت"). Live phase comes from `matchRoundInfo.event_id` + `time` (minute). Phase codes per product owner: 1 first half, 2 half-time, 3 second half, 4 end of second half, 5 first extra time, 6 end of ET1, 7 second extra time, 8 end of ET2, 10/12 penalties. |
| Dates | `date` is `YYYY-MM-DD HH:mm:ss`, no zone, **Egypt time** (product owner). `time` is the data provider's time, 3 h earlier; not used. One sample suggests `date` is UTC+3 year-round, which is 1 h ahead of Cairo in winter: pending backend confirmation. Game fixtures use ISO UTC (`match_datetime`). |
| Images | Absolute URLs on `https://v3.appkora.com/storage/...` in both environments. Event icons sometimes relative (`storage/events/var.png`). |
| Rich text | Article `description` is HTML. Must be sanitised before rendering. |
| Realtime | None. Live scores need polling. |
| Taxonomy | `sport_id` (1 = football) and `service_id`: 1 Local, 2 International, 3 Africa, 4 Other sports, 5 Saudi, 6 Asian, 7 Fitness, 8 Football Capsule (`/services`). |
| TEST data | Fixtures stop around Feb 2026, so `homeCalendar`/`calendar` return empty yesterday/today/tomorrow. |

## Write endpoints and CORS (Phase 2)

| Endpoint | Body (from TEST validation errors) |
|:--|:--|
| `POST /guess-games/:id/answer` | `user_identifier` (required unless `source` is `app`), `guess_game_choice_id` |
| `POST /team-squad-games/:id/answer` | `user_identifier`, `answer[]` with exactly 11 players |
| `POST /match-predict-games/:id/answer` | `game_fixture_id` validated first; the rest unconfirmed because every TEST fixture answers "Predictions are closed for this match". App sends `user_identifier`, `outcome`, `predicted_team_id`. |

CORS: `Access-Control-Allow-Origin: *` on TEST and PROD. PROD preflight allows `GET, OPTIONS,
PUT, DELETE` but not POST, so the web app sends answers as `application/x-www-form-urlencoded`
(a simple request, no preflight).

## Discrepancies and open issues

1. **`/matches` ignores filters.** `month`, `year`, `tournament_id`, `team_id`, `date`, `day`, `match_date`, `from/to`, `status` all return the same 4,453-row list. No endpoint was found for "matches on a chosen date". Working alternatives: `homeCalendar` (yesterday/today/tomorrow), `matches_dates?month&year` (which days have matches), `tournament/matches?tournament_id&season_id`, `tournamentCalendar`, `teamCalendar`.
2. **Standings:** leagues use `teamsStanding?tournament_id&season_id` (one flat table). Group competitions (World Cup, AFCON) use `tournament/standing`, whose `group_stage[]` has a group `title` and its `teams` (W/D/L, GD, form) plus a best-third-placed table; it is empty for leagues and on TEST, so this was only visible on PROD. `teamsStanding` for groups is a flat list without group labels and with duplicates. The `has_standing` flag exists only in `activeTournaments`, not in `tournaments/:id`.
3. **`transfers` vs `transferes`:** Postman uses `/transfers` (404). Only `/transferes` exists.
4. **Postman copy errors:** "Tournament History" calls `/tournament/standing` (real: `/tournament-history/:id`). "Top Assists Players" and both Al Ahly gallery requests call `/teams/:team/squad` (real: `/top-assists`, `/al-ahly/galleryList/:team`, `/teamGallery/:id`).
5. **`tournament-progress`** example uses `sesson_id` (typo).
6. **Case:** Markdown lists `/TeamStatistics` and `/teamStatistics`; only lowercase exists.
7. **Vendor_ID:** `TWIST_SPORTS` (Markdown) vs `TWIST_TV` (Postman phone login). Moot while account management is out of scope.
8. **Games integrity:** `games/:id` and `guess-games/:id` return `choices[].is_correct` to the client, so answers are visible before submitting. `user_identifier` is a free string (Postman example is a phone number). Rate limit: one play per day (product owner). Guest identity: recommended device UUID rather than IP (shared carrier IPs).
9. **Prediction and squad games:** the stage-filtered lists return 404 for `tournament_id=3&season_id=2&stage_id=2` ("No query results for model MatchPredictGame / TeamSquadGame"), but `GET /games/:id` returns the full payload: prediction games give `fixtures[]` with `home/draw/away` outcomes, community `stats.percentages`, bilingual names and UTC `match_datetime`; squad games give `positions[]` and `players[]`. Open: the prediction answer body (Postman uses `predicted_team_id`, which can't express a draw) and how many players to pick per position.
10. **`MatchEventsimages`** returns event icons (product owner), not match photos. Not used.
11. **`fitness/videos/:id`** returns 500 (out of scope, reported for the backend team).

## Security notes for the backend team

- The Postman request "Account Management / Token Auth / Revoke" contained what looks like a real
  Bearer `idToken` and `refreshToken`. Revoke them on the backend. In this repo they are replaced
  with `{{idToken}}` / `{{refreshToken}}`, and the signup example's staff email and password with
  `{{email}}` / `{{password}}` (2026-10-22), before the first push.
- TEST runs with Laravel debug on; 404/500 bodies expose stack traces and server paths.
- The collection description says JWT signatures are not verified yet.
- Guess-game answers are exposed in the GET payload (see issue 8).

## Endpoint status

Sample ids used: match `2578`, team `26`, player `1297`/`845`, tournament `1`/`3`/`24`/`28`,
season `1`/`2`. "exists" means the route responded; it does not promise useful data for every id.

| Method | Path (TEST) | Status |
|:--|:--|:--|
| GET | `/matches` | ✅ exists (filters ignored, see issue 1) |
| GET | `/tournament/matches` | ✅ exists |
| GET | `/al-ahly/matches` | ✅ exists |
| GET | `/lineup/2578` | ❌ missing (404 route not found) |
| GET | `/newLineup/2578` | ✅ exists |
| GET | `/matchStatistics` | ✅ exists |
| GET | `/tournament_matches` | ❌ missing (404 route not found) |
| GET | `/match_events` | ✅ exists |
| GET | `/goalMatchEvents` | ✅ exists |
| GET | `/matches_dates` | ✅ exists (needs `month`, `year`) |
| GET | `/tournament/matches_dates` | ✅ exists |
| GET | `/latest-matches-for-teams` | ❌ missing (404 route not found) |
| GET | `/newLatest-matches-for-teams` | ✅ exists |
| GET | `/TeamStatistics` | ❌ missing (404 route not found) |
| GET | `/whoWinWho` | ❌ missing (404 route not found) |
| GET | `/MatchEventsimages` | ✅ exists |
| GET | `/simple_teams` | ✅ exists |
| GET | `/teams/26` | ✅ exists |
| GET | `/teamStatistics` | ✅ exists |
| GET | `/teams/26/squad` | ✅ exists |
| GET | `/al-ahly/teams/1/squad` | ✅ exists |
| GET | `/top-scorers` | ✅ exists |
| GET | `/top-assists` | ✅ exists |
| GET | `/searchTeams` | ❌ missing (404 route not found) |
| GET | `/players/1` | ❌ missing (404 route not found) |
| GET | `/players/1/details` | ✅ exists |
| GET | `/players/1/statistics` | ✅ exists |
| GET | `/player-transfer-history/1` | ❌ missing (404 route not found) |
| GET | `/player-history-details/845` | ✅ exists |
| GET | `/playerSeasons_statistics` | ❌ missing (404 route not found) |
| GET | `/playerStatistics` | ❌ missing (404 route not found) |
| GET | `/transferes` | ✅ exists |
| GET | `/transfers` | ❌ missing (404 route not found) |
| GET | `/searchPlayers` | ❌ missing (404 route not found) |
| GET | `/allplayers` | ❌ missing (404 route not found) |
| GET | `/tournaments` | ✅ exists |
| GET | `/activeTournaments` | ✅ exists |
| GET | `/tournaments/1` | ✅ exists |
| GET | `/standing` | ✅ exists |
| GET | `/tournament/standing` | ✅ exists (metadata only, see issue 2) |
| GET | `/newStanding` | ❌ missing (404 route not found) |
| GET | `/teamsStanding` | ✅ exists |
| GET | `/tournament-history/1` | ✅ exists |
| GET | `/topLeaguePlayers` | ✅ exists |
| GET | `/tournament/tree` | ❌ missing (404 route not found) |
| GET | `/knockout-stage-bracket` | ✅ exists |
| GET | `/matchesGroupdByDates` | ✅ exists |
| GET | `/searchTournaments` | ❌ missing (404 route not found) |
| GET | `/calendar` | ✅ exists |
| GET | `/teamCalendar` | ✅ exists |
| GET | `/homeCalendar` | ✅ exists |
| GET | `/otherCalendar` | ❌ missing (404 route not found) |
| GET | `/tournamentCalendar` | ✅ exists |
| GET | `/media` | ✅ exists |
| GET | `/media/1` | ✅ exists |
| GET | `/mixMedia` | ✅ exists |
| GET | `/matchMedia` | ✅ exists |
| GET | `/al-ahly/galleryList/1` | ✅ exists |
| GET | `/teamGallery/1` | ✅ exists |
| GET | `/popularComparisons` | ❌ missing (404 route not found) |
| GET | `/playersStatistics` | ❌ missing (404 route not found) |
| GET | `/TeamsStatistics` | ❌ missing (404 route not found) |
| GET | `/comparisonTeamsStatistics` | ❌ missing (404 route not found) |
| GET | `/results-and-matches` | ✅ exists |
| GET | `/stages` | ✅ exists |
| GET | `/tournament-progress` | ✅ exists |
| GET | `/tournament-most-last-winner` | ✅ exists |
| GET | `/tournament-players-stat` | ✅ exists, required params: tournament_id and season_id |
| GET | `/tournament-teams` | ✅ exists |
| GET | `/team-of-the-week` | ✅ exists |
| GET | `/sports` | ❌ missing (also missing on PROD) |
| POST | `/create` | ❌ missing (also missing on PROD) |
| GET | `/favourites` | ❌ missing (also missing on PROD) |
| GET | `/delete` | ❌ missing (404 route not found) |
| GET | `/userPoints` | ❌ missing (also missing on PROD) |
| GET | `/mostSearched` | ❌ missing (also missing on PROD) |
| GET | `/full-search` | ✅ exists |
| GET | `/seasons` | ✅ exists |
| GET | `/getService` | ❌ missing (404 route not found) |
| GET | `/global-config` | ✅ exists |
| GET | `/global-settings` | ✅ exists |
| GET | `/services` | ✅ exists |
| GET | `/games` | ✅ exists |
| GET | `/games/11` | ✅ exists |
| POST | `/guess-games/5/answer` | ✅ exists (POST) |
| GET | `/guess-games` | ✅ exists |
| GET | `/guess-games/5` | ✅ exists |
| GET | `/match-predict-games` | ✅ exists, required params: tournament_id, season_id, stage_id |
| POST | `/match-predict-games/1/answer` | ✅ exists (POST) |
| GET | `/team-squad-games` | ✅ exists, required params: tournament_id, season_id, stage_id |
| POST | `/team-squad-games/1/answer` | ✅ exists (POST) |
| GET | `/games/participate` | ✅ exists, 404 for sample input |

### Out of scope for v1 (status recorded for later)

| Method | Path (TEST) | Status |
|:--|:--|:--|
| POST | `/account/auth/phone/sendOtp` | ✅ exists (POST) |
| POST | `/account/auth/phone/login` | ✅ exists (POST) |
| POST | `/account/auth/mail/exists` | ✅ exists (POST) |
| POST | `/account/auth/mail/signup` | ✅ exists (POST) |
| POST | `/account/auth/mail/verify` | ✅ exists (POST) |
| POST | `/account/auth/mail/resendVerification` | ✅ exists (POST) |
| POST | `/account/auth/mail/login` | ✅ exists (POST) |
| POST | `/account/auth/password/forgot` | ✅ exists (POST) |
| POST | `/account/auth/password/confirmForgot` | ✅ exists (POST) |
| POST | `/account/auth/token/refresh` | ✅ exists (POST) |
| POST | `/account/user/logout` | ✅ exists (POST) |
| POST | `/account/auth/passwordless/login` | ✅ exists (POST) |
| GET | `/account/passwordless-auth/request-code` | ✅ exists (400 without params) |
| POST | `/account-management/social/redirect-url` | ❌ missing (404 route not found) |
| POST | `/account/auth/social/serviceUrl` | ❌ missing on appkora (Markdown puts it on another host) |
| GET | `/account/user` | ✅ exists, needs Bearer token |
| GET | `/account/subscription` | ✅ exists, needs Bearer token |
| GET | `/account/profile` | ✅ exists, needs Bearer token |
| GET | `/account/meal-plan` | ✅ exists, needs Bearer token |
| POST | `/otp/request` | ✅ exists (POST) |
| POST | `/subscription/request-otp` | ✅ exists (POST) |
| POST | `/tpay/auth/login` | ✅ exists (POST) |
| GET | `/tpay/auth/exists` | ✅ exists, required params: msisdn |
| GET | `/kg/exercises/{play-it-right,home,gym,reels}` | ✅ exists |
| GET | `/kg/nutrition-health` | ❌ missing on appkora (Markdown puts it on the legacy host) |
| GET | `/fitness/{articles,recipes,collections}` | ✅ exists |
| GET | `/fitness/videos/1` | ⚠️ exists, 500 on sample id |
| GET | `/ramadan-challenge/days/progress` | ✅ exists |
| GET | `/v1/fitness/programs` | ✅ exists, needs Bearer token |
| GET | `/v1/fitness/{muscle-groups,section-collections}` | ✅ exists |
| GET | `/olymbicHomeCalendar`, `/olymbicBrizes` | ❌ missing |

Not checked: every endpoint on the legacy hosts (`apis.twist-sports.com`, `scouting.twist-sports.com`,
`subs.twist-sports.com`, `he.twist-sports.com`, `test-api.twistmena.com`). They are out of scope.
