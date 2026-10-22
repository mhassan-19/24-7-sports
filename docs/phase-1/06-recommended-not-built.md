# 6. Recommended but not built

None of these are in the prototype's functional scope or the v1 build. Each needs an API that
doesn't exist today (verified on TEST, see [API audit](../api/API_AUDIT.md)). Ordered by expected
value for a football app.

| # | Feature | Why it matters | API it would need |
|:--|:--|:--|:--|
| R1 | **24/7 Sports accounts** (sign up, sign in, profile) | Prerequisite for everything personal; Twist account management is out of scope for 24/7 | A 24/7 account API (or a confirmed vendor on the shared one): sign up/in, refresh, logout, profile |
| R2 | **Follow teams, players, competitions** | Core retention feature of every major football app; drives a personalised home | `GET/POST/DELETE /me/follows` (the documented `/create`, `/favourites`, `/delete` return 404) |
| R3 | **Push notifications** (kick-off, goals, red cards, full time for followed teams) | Biggest driver of daily return visits; table stakes for a live-scores product | Device token registration, per-entity notification preferences, server-side event triggers via FCM/APNs |
| R4 | **Matches on any date + calendar** | Users plan around fixtures; today the app can only show yesterday/today/tomorrow | A working `GET /matches?date=YYYY-MM-DD&tz=` (filters are ignored today) |
| R5 | **Realtime live scores** | Seconds matter during matches; polling is slower and costlier at scale | WebSocket or SSE channel for live matches, or `GET /live` with short cache headers |
| R6 | **English content** | Unlocks the English locale that is already built | A locale parameter on content endpoints (the DB appears to store translations) |
| R7 | **Video highlights in the match centre** | Highest-engagement content type for football fans | Populated `media`/`embed_code`/`video_cover` per match (fields exist but are empty in TEST), plus playback rights |
| R8 | **Live text commentary** | Keeps users in the match centre during live games | Minute-by-minute commentary endpoint |
| R9 | **Where to watch** | Common fan question before kick-off | Populated `channel`/`channel_name` on matches (present but empty in TEST) |
| R10 | **Player and team comparison** | Popular discovery feature; the old app had it | Comparison endpoints (`playersStatistics`, `TeamsStatistics`, `popularComparisons` return 404) |
| R11 | **All-time head to head** | Context before big matches | H2H summary endpoint (`whoWinWho` returns 404); today only recent meetings exist |
| R12 | **Game leaderboards and points** | Gives games a reason to return weekly | Leaderboard and user points endpoints tied to an identity (`userPoints` returns 404) |
| R13 | **Trending searches** | Faster discovery, especially on mobile | `GET /mostSearched` (returns 404) |
| R14 | **Server-checked game answers** | Today `is_correct` is sent to the client before answering | Answer endpoint returns correctness; GET stops exposing it |

## Client-only enhancements (no new API, need your approval)

These use data the app already loads, so they fit the "backed by an existing endpoint" rule,
but they add scope:
- Share a match, team, player or article (Web Share API / native share sheet).
- Add a fixture to the device calendar (generated `.ics` on web, `expo-calendar` on mobile; needs
  calendar permission on mobile).
- Remember the last region filter and last-viewed competition.
