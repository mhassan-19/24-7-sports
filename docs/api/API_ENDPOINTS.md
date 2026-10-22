# Twist Sports - Frontend API Endpoints Documentation

This document contains all API endpoints consumed by the Twist Sports Frontend application (`New-Twist-FE`), cataloged by module, HTTP method, base URL environment, default base URL, and source file.

---

## 1. Environment & Base URLs Overview

Derived from `.env` and `src/services/axios-instance.js`:

| Client Name | Environment Variable | Default Base URL | Description / Headers |
|:---|:---|:---|:---|
| `baseAxios` | `VITE_APP_BASE_URL` | `https://v3.appkora.com/api` | Main sports API (matches, players, teams, etc.) |
| `oldBaseAxios` | `VITE_APP_OLD_BASE_URL` | `https://apis.twist-sports.com/api` | Legacy Twist API (games, fitness, quizzes) |
| `testBaseAxios` | `VITE_APP_TEST_BASE_URL` | `https://testv3.appkora.com/api` | Test/Staging API & OTP services |
| `baseSocialLogin` | `VITE_APP_SOCIAL_LOGIN_BASE_URL` | `https://test-api.twistmena.com/` | Social OAuth authentication |
| `baseSquashAxios` | `VITE_APP_SQUASH_BASE_URL` | `https://apis.twist-sports.com/api` | Squash tournaments and matches |
| `baseMeloukAxios` | `VITE_APP_MELOUK_BASE_URL` | `https://scouting.twist-sports.com/api` | Melouk El Kora (`Application-key` header) |
| `baseHeaderEnrichmentAxios` | `VITE_APP_HEADER_ENRICHMENT_URL` | `http://he.twist-sports.com/` | Mobile operator header enrichment |
| `baseSubscriptionAxios` | `VITE_APP_SUBSCRIPTION_BASE_URL` | `https://subs.twist-sports.com/` | Operator subscription billing (`application_key` header) |
| `baseNewSubscriptionAxios` | `VITE_APP_BASE_URL` | `https://v3.appkora.com/api` | New subscription OTP flow (`application_key` header) |

---

## 2. Account Management & Authentication

### 2.1 Auth
**File:** `src/services/AccountManagement/Auth/index.js`

| Method | Endpoint | Base URL Client | Description / Payload |
|:---|:---|:---|:---|
| `POST` | `account/auth/phone/sendOtp` | `baseAxios` | Send OTP SMS to user phone |
| `POST` | `account/auth/phone/login` | `baseAxios` | Login via phone and OTP (Header: `Vendor_ID: TWIST_SPORTS`) |
| `POST` | `account/auth/mail/exists` | `baseAxios` | Check if email is already registered |
| `POST` | `account/auth/mail/signup` | `baseAxios` | Sign up with email (Header: `Vendor_ID: TWIST_SPORTS`) |
| `POST` | `account/auth/mail/verify` | `baseAxios` | Verify email code/token |
| `POST` | `account/auth/mail/resendVerification` | `baseAxios` | Resend verification email |
| `POST` | `account/auth/mail/login` | `baseAxios` | Email & password login |
| `POST` | `account/auth/password/forgot` | `baseAxios` | Request password reset code |
| `POST` | `account/auth/password/confirmForgot` | `baseAxios` | Submit new password with reset code |
| `POST` | `account/auth/social/serviceUrl` | `baseSocialLogin` | Get OAuth redirect URL (`params: { service, product }`) |
| `POST` | `account/auth/social/:code` | `baseSocialLogin` | Exchange social auth code for tokens |

### 2.2 Profile & Sessions
**File:** `src/services/AccountManagement/Profile/index.js`

| Method | Endpoint | Base URL Client | Description / Headers |
|:---|:---|:---|:---|
| `POST` | `/account/auth/token/refresh` | `baseAxios` | Refresh token (Headers: `idToken`, `refreshToken`) |
| `GET` | `/account/user` | `baseAxios` | Get current user profile (Header: `Authorization: Bearer <token>`) |
| `PUT` | `/account/user` | `baseAxios` | Update profile info (Headers: `countryCode: ["[EG]"]`, `Authorization`) |
| `GET` | `/account/subscription` | `baseAxios` | Get user active subscriptions |
| `POST` | `/account/user/logout` | `baseAxios` | User logout (Headers: `Authorization`, `refreshToken`) |

---

## 3. Twist Football & Sports Core

### 3.1 Matches
**File:** `src/services/Twist/match/index.js`

| Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|
| `GET` | `/matches` | `baseAxios` | List matches by date/tournament/team |
| `GET` | `/tournament/matches` | `baseAxios` | Matches for a specific tournament |
| `GET` | `/al-ahly/matches` | `baseAxios` | Specific matches for Al Ahly SC |
| `GET` | `/lineup/:match_id` | `baseAxios` | Match lineup |
| `GET` | `/newLineup/:match_id` | `baseAxios` | Match lineup (new schema) |
| `GET` | `/matchStatistics` | `baseAxios` | Detailed match statistics (possession, shots, etc.) |
| `GET` | `/tournament_matches` | `baseAxios` | Tournament match list |
| `GET` | `/match_events` | `baseAxios` | Match events timeline (cards, substitutions) |
| `GET` | `/goalMatchEvents` | `baseAxios` | Goal events with video/image highlights |
| `GET` | `/matches_dates` | `baseAxios` | Calendar days that contain matches |
| `GET` | `/tournament/matches_dates` | `baseAxios` | Match dates for a specific tournament |
| `GET` | `/latest-matches-for-teams` | `baseAxios` | Recent head-to-head match results |
| `GET` | `/newLatest-matches-for-teams` | `baseAxios` | Latest matches (new version) |
| `GET` | `/TeamStatistics` | `baseAxios` | Head-to-head team statistics |
| `GET` | `/whoWinWho` | `baseAxios` | Historic wins comparison between two teams |
| `GET` | `/MatchEventsimages` | `baseAxios` | Photo highlights for match events |

### 3.2 Teams
**File:** `src/services/Twist/team/index.js`

| Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|
| `GET` | `/simple_teams` | `baseAxios` | Simple list of teams |
| `GET` | `/teams/:id` | `baseAxios` | Team profile, squad, and bio |
| `GET` | `/teamStatistics` | `baseAxios` | Team statistics |
| `GET` | `/teams/:team_id/squad` | `baseAxios` | Team player roster / squad |
| `GET` | `/al-ahly/teams/:team_id/squad` | `baseAxios` | Al Ahly team squad |
| `GET` | `/top-scorers` | `baseAxios` | Team's top goal scorers |
| `GET` | `/top-assists` | `baseAxios` | Team's top assists |
| `GET` | `/searchTeams?keyword=:TeamName` | `baseAxios` | Search teams by name keyword |

### 3.3 Players
**File:** `src/services/Twist/player/index.js`

| Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|
| `GET` | `/players/:player_id` | `baseAxios` | Player profile details |
| `GET` | `/players/:player_id/details` | `baseAxios` | Detailed player profile (new version) |
| `GET` | `/players/:playerId/statistics` | `baseAxios` | Player in-depth season statistics |
| `GET` | `/player-transfer-history/:player_id` | `baseAxios` | Player transfer summary |
| `GET` | `/player-history-details/:player_id` | `baseAxios` | Detailed club transfer history |
| `GET` | `/playerSeasons_statistics` | `baseAxios` | Season-by-season player stats |
| `GET` | `/playerStatistics` | `baseAxios` | Current season player statistics |
| `GET` | `/transferes` | `baseAxios` | Global transfer window updates |
| `GET` | `/top-scorers` | `baseAxios` | League top scorers |
| `GET` | `/top-assists` | `baseAxios` | League top assist providers |
| `GET` | `/searchPlayers?keyword=:playerName` | `baseAxios` | Search players by name keyword |
| `GET` | `/allplayers` | `baseAxios` | All featured players |

### 3.4 Tournaments
**File:** `src/services/Twist/tournaments/index.js`

| Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|
| `GET` | `/tournaments` | `baseAxios` | List of all tournaments / categories |
| `GET` | `/activeTournaments` | `baseAxios` | Currently ongoing tournaments |
| `GET` | `/tournaments/:id` | `baseAxios` | Tournament details & seasons |
| `GET` | `/standing` | `baseAxios` | Tournament league table / standings |
| `GET` | `/tournament/standing` | `baseAxios` | Standings by tournament ID |
| `GET` | `/newStanding` | `baseAxios` | Homepage featured standings |
| `GET` | `/teamsStanding` | `baseAxios` | Teams ranking in tournament |
| `GET` | `/tournament-history/:tournament_id` | `baseAxios` | Past champions and tournament history |
| `GET` | `/topLeaguePlayers` | `baseAxios` | Top rated players in tournament |
| `GET` | `/tournament/tree` | `baseAxios` | Tournament bracket visualization tree |
| `GET` | `/knockout-stage-bracket` | `baseAxios` | Knockout bracket fixtures |
| `GET` | `/matchesGroupdByDates` | `baseAxios` | Matches grouped by date |
| `GET` | `/searchTournaments?keyword=:name` | `baseAxios` | Search tournaments |

### 3.5 Calendar
**File:** `src/services/Twist/calendar/index.js`

| Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|
| `GET` | `/calendar` | `baseAxios` | General match calendar |
| `GET` | `/teamCalendar` | `baseAxios` | Team-specific fixture calendar |
| `GET` | `/homeCalendar` | `baseAxios` | Homepage calendar widget |
| `GET` | `/otherCalendar` | `baseAxios` | Other sports calendar (basketball, handball, etc.) |
| `GET` | `/tournamentCalendar` | `baseAxios` | Tournament-specific calendar |

### 3.6 Media & Gallery
**Files:** `src/services/Twist/media/index.js` and `src/services/Twist/gallery/index.js`

| Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|
| `GET` | `/media` | `baseAxios` | News articles & media feed |
| `GET` | `/media/:mediaId` | `baseAxios` | Single media/article details |
| `GET` | `/mixMedia` | `baseAxios` | Mixed feed (articles, videos, highlights) |
| `GET` | `/matchMedia` | `baseAxios` | News & media associated with a match |
| `GET` | `/al-ahly/galleryList/:teamId` | `baseAxios` | Team photo galleries list |
| `GET` | `/teamGallery/:galleryId` | `baseAxios` | Photo gallery details and photos |

### 3.7 Comparisons
**File:** `src/services/Twist/comparisons/index.js`

| Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|
| `GET` | `/popularComparisons` | `baseAxios` | Trending comparisons |
| `GET` | `/playersStatistics` | `baseAxios` | Compare stats between 2 players |
| `GET` | `/TeamsStatistics` | `baseAxios` | Compare stats between multiple teams |
| `GET` | `/comparisonTeamsStatistics` | `baseAxios` | Compare head-to-head between 2 teams |

### 3.8 Club World Cup & AFCON
**Files:** `src/services/Twist/ClubWorldCup/index.js` and `src/services/Twist/afcon/index.js`

| Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|
| `GET` | `/results-and-matches` | `baseAxios` | Club World Cup fixtures & scores |
| `GET` | `/stages` | `baseAxios` | Club World Cup tournament stages |
| `GET` | `/tournament-progress` | `baseAxios` | Tournament round progress |
| `GET` | `/tournament-most-last-winner` | `baseAxios` | Most titles & last champion |
| `GET` | `/tournament-players-stat` | `baseAxios` | Club World Cup player leaders |
| `GET` | `/tournament-teams` | `baseAxios` | Club World Cup teams list |
| `GET` | `/team-of-the-week` | `baseAxios` | AFCON team of the week |

### 3.9 Squash
**File:** `src/services/Twist/squash/index.js`

| Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|
| `GET` | `/squashTournaments` | `baseSquashAxios` | Squash tournament list |
| `GET` | `/squashTournaments/players` | `baseSquashAxios` | Participating squash players |
| `GET` | `/squashMatches` | `baseSquashAxios` | Squash match list / details |
| `GET` | `/squashCalendar` | `baseSquashAxios` | Squash match schedule |
| `GET` | `/squashPlayers` | `baseSquashAxios` | Squash player rankings & profiles |
| `GET` | `/squashMatchesDates` | `baseSquashAxios` | Squash active match dates |

### 3.10 General User, Search & Config
**Files:** `src/services/Twist/user/index.js`, `search/index.js`, `seasons/index.js`, `teamAndPlayerService/index.js`, `reports/index.js`, `youTubeBanner/index.js`

| Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|
| `GET` | `/sports` | `baseAxios` | List of supported sports |
| `POST` | `/create` | `baseAxios` | Save user favorite team/player |
| `GET` | `/favourites` | `baseAxios` | Get user favorites list |
| `GET` | `/delete` | `baseAxios` | Remove item from user favorites |
| `GET` | `/userPoints` | `baseAxios` | Get accumulated user game points |
| `GET` | `/mostSearched` | `baseAxios` | Trending search queries |
| `POST` | `/mostSearched` | `baseAxios` | Record a search query |
| `GET` | `/full-search` | `baseAxios` | Universal search across all sports entities |
| `GET` | `/seasons` | `baseAxios` | Football seasons list |
| `GET` | `/getService` | `baseAxios` | Resolve service ID for team/player |
| `GET` | `/global-config` | `baseAxios` | Global configuration settings |
| `GET` | `/global-settings` | `baseAxios` | YouTube banner & social links |
| `POST` | `/portal/log` | `oldBaseAxios` | Send user analytics / event log |
| `GET` | `https://api.ipify.org/?format=json` | Direct Axios | Fetch user public IP address |

---

## 4. Interactive Games & Predictions

| Module | Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|:---|
| `games` | `GET` | `/games` | `baseAxios` | List interactive games |
| `games` | `GET` | `/games/:id` | `baseAxios` | Single game info & questions |
| `games` | `POST` | `/guess-games/:id/answer` | `baseAxios` | Submit answer for guess game |
| `whoWinMatches` | `GET` | `/whoWinMatches` | `oldBaseAxios` | Match prediction voting list |
| `whoWinMatches` | `POST` | `/whoWinMatchesAnswer` | `oldBaseAxios` | Submit match winner prediction |
| `whoWinMatches` | `GET` | `/match-predict-games` | `baseAxios` | Score prediction games |
| `whoWinMatches` | `POST` | `/match-predict-games/:id/answer` | `baseAxios` | Submit score prediction answer |
| `guessThePlayer` | `GET` | `guess-players` | `oldBaseAxios` | Guess the Player questions |
| `guessThePlayer` | `POST` | `/guess-player-answers` | `oldBaseAxios` | Submit Guess the Player answer |
| `matchThePlayer` | `GET` | `/match_the_players` | `oldBaseAxios` | Match the Player card pairs |
| `matchThePlayer` | `POST` | `/match_the_players_answers` | `oldBaseAxios` | Submit matching answers |
| `whereIsTheBall` | `GET` | `/ball-position` | `oldBaseAxios` | Where is the Ball challenge |
| `whereIsTheBall` | `POST` | `/ball-position-answer` | `oldBaseAxios` | Submit ball coordinates |
| `quizzesGame` | `GET` | `/quiz` | `oldBaseAxios` | Quiz questions |
| `quizzesGame` | `POST` | `/quizAnswers` | `oldBaseAxios` | Submit quiz answers |
| `quizzesGame` | `GET` | `/checkPlayedGames` | `oldBaseAxios` | Check if quiz was played today |
| `eurogames` | `POST` | `/pollGame` | `oldBaseAxios` | Poll / prediction submission |
| `eurogames` | `GET` | `/predictedMatches` | `oldBaseAxios` | Predicted matches list |
| `eurogames` | `GET` | `/guessWhoQuestions` | `oldBaseAxios` | Guess Who question list |
| `eurogames` | `POST` | `/playGuessWho` | `oldBaseAxios` | Submit Guess Who answer |
| `eurogames` | `GET` | `/guessShirtQuestions` | `oldBaseAxios` | Guess Shirt number questions |
| `eurogames` | `POST` | `/playGuessShirt` | `oldBaseAxios` | Submit Guess Shirt answer |
| `worldcupgames` | `GET` | `/guess-teams` | `oldBaseAxios` | Guess the Team game |
| `worldcupgames` | `POST` | `/guess-team-answers` | `oldBaseAxios` | Submit Guess the Team answer |
| `worldcupgames` | `GET` | `/prediction-matches-points` | `oldBaseAxios` | Prediction points leaderboard |
| `worldcupgames` | `GET` | `/user-answer-today` | `oldBaseAxios` | Verify if user submitted today |
| `teamOfWeek` | `GET` | `https://testv3.appkora.com/api/team-squad-games` | Direct fetch | Team of the week fantasy squad |
| `teamOfWeek` | `POST` | `https://testv3.appkora.com/api/team-squad-games/:id/answer` | Direct fetch | Submit fantasy squad selection |

---

## 5. Fitness & Fitness KG

### 5.1 Mazhar Fitness
**Directory:** `src/services/Fitness/`

| Sub-module | Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|:---|
| `tips` | `GET` | `/mazharAdvice` | `oldBaseAxios` | Mazhar fitness tips list |
| `tips` | `GET` | `/mazharAdvice/:id` | `oldBaseAxios` | Single fitness tip |
| `workout` | `GET` | `/exercises` | `oldBaseAxios` | Exercise routines |
| `workout` | `GET` | `/exercises/:id` | `oldBaseAxios` | Exercise details & video |
| `answers` | `GET` | `/checkAskMazhar` | `oldBaseAxios` | Check if user asked Mazhar |
| `answers` | `GET` | `/askMazhar` | `oldBaseAxios` | Q&A answers list |
| `answers` | `GET` | `/askMazhar/:id` | `oldBaseAxios` | Single Q&A detail |
| `answers` | `POST` | `/askMazhar` | `oldBaseAxios` | Post a question to Mazhar |
| `Nutrition` | `GET` | `/foods` | `oldBaseAxios` | Disliked/excluded foods list |
| `Nutrition` | `GET` | `/meals` | `oldBaseAxios` | Diet meals recommendations |
| `Nutrition` | `POST` | `/userFoodSystem` | `oldBaseAxios` | Save user dietary preference |
| `ramadanWorkOut` | `GET` | `/ramadanDays` | `oldBaseAxios` | 30 days Ramadan workouts |
| `ramadanWorkOut` | `GET` | `/ramadanDay/:id` | `oldBaseAxios` | Ramadan day workout routine |
| `ramadanWorkOut` | `GET` | `/userWorkoutProgress` | `oldBaseAxios` | User workout completion progress |
| `ramadanWorkOut` | `GET` | `/workout/:id` | `oldBaseAxios` | Workout details |
| `ramadanWorkOut` | `POST` | `/userWorkoutProgress` | `oldBaseAxios` | Submit workout progress |
| `user` | `POST` | `/create` | `oldBaseAxios` | Add fitness favorite |
| `user` | `GET` | `/favourites` | `oldBaseAxios` | Get fitness favorites |
| `user` | `GET` | `/delete` | `oldBaseAxios` | Remove fitness favorite |

### 5.2 Fitness KG & Ramadan Challenge
**File:** `src/services/FitnessKG/index.js`

| Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|
| `POST` | `/otp/request` | `testBaseAxios` | Request phone OTP |
| `POST` | `/otp/verify` | `testBaseAxios` | Verify phone OTP |
| `GET` | `/kg/exercises/play-it-right` | `baseAxios` | "Play It Right" video exercises |
| `GET` | `kg/exercises/home` | `baseAxios` | Work out at home routines |
| `GET` | `kg/exercises/gym` | `baseAxios` | Work out at gym routines |
| `GET` | `kg/exercises/reels` | `baseAxios` | Quick exercise video reels |
| `GET` | `kg/nutrition-health` | `oldBaseAxios` | Nutrition and health tips |
| `GET` | `/fitness/articles` | `baseAxios` | Fitness articles list |
| `GET` | `/fitness/articles/:id` | `baseAxios` | Single fitness article |
| `GET` | `/fitness/recipes` | `baseAxios` | Healthy recipes list |
| `GET` | `/fitness/recipes/:id` | `baseAxios` | Recipe details & preparation |
| `GET` | `/ramadan-challenge/days/progress` | `baseAxios` | Global Ramadan challenge days |
| `GET` | `/ramadan-challenge/days/user-progress` | `baseAxios` | User Ramadan challenge progress |
| `POST` | `/ramadan-challenge/user-progress` | `baseAxios` | Save user challenge progress |
| `GET` | `/ramadan-challenge/days/exercises` | `baseAxios` | Challenge day exercises |
| `GET` | `/ramadan-challenge/days/calendar` | `baseAxios` | Challenge days calendar |
| `GET` | `/fitness/collections` | `baseAxios` | Fitness video collections |
| `GET` | `/fitness/collections/:collectionId` | `baseAxios` | Collection details |
| `GET` | `/fitness/collections/:collectionId/videos`| `baseAxios` | Videos in a collection |
| `GET` | `/fitness/videos/:videoId` | `baseAxios` | Single video details |
| `GET` | `/kg/exercises/:id` | `baseAxios` | Single challenge exercise details |

---

## 6. Melouk El Kora (Kings of Football)
**Directory:** `src/services/Melouk/`

| Sub-module | Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|:---|
| `mido` | `GET` | `/mido-diaries` | `baseMeloukAxios` | Mido diary video episodes |
| `mido` | `GET` | `/mido-riddles` | `baseMeloukAxios` | Mido riddle questions |
| `mido` | `POST` | `/answer` | `baseMeloukAxios` | Submit answer for Mido riddle |
| `mido` | `POST` | `/ask-mido` | `baseMeloukAxios` | Submit fan question for Mido |
| `mido` | `GET` | `/analytics-studios` | `baseMeloukAxios` | Mido tactical match analysis |
| `fantasy` | `GET` | `/fantasy-ranking` | `baseMeloukAxios` | Fantasy leaderboard |
| `happendThisDay` | `GET` | `/happened-this-day` | `baseMeloukAxios` | Historical football events on this day |

---

## 7. Olympics
**Directory:** `src/services/Olympics/`

| Sub-module | Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|:---|
| `games` | `GET` | `/olymbicKingQuestions` | `oldBaseAxios` | Olympic King quiz questions |
| `games` | `POST` | `/playOlymbicKing` | `oldBaseAxios` | Submit Olympic King answer |
| `games` | `GET` | `/olymbicQuizQuestions` | `oldBaseAxios` | Olympic quiz questions |
| `games` | `POST` | `/playOlymbicQuiz` | `oldBaseAxios` | Submit Olympic quiz answer |
| `games` | `GET` | `/olymbicArostyQuestions` | `oldBaseAxios` | Olympic riddle questions |
| `games` | `POST` | `/playOlymbicArosty` | `oldBaseAxios` | Submit Olympic riddle answer |
| `matches` | `GET` | `/olymbicHomeCalendar` | `baseAxios` | Olympic match schedule |
| `matches` | `GET` | `/nextMatches` | `baseAxios` | Next upcoming Olympic matches |
| `matches` | `GET` | `/previousMatches` | `baseAxios` | Past Olympic match results |
| `medals` | `GET` | `/olymbicBrizes` | `baseAxios` | Olympic medal table standings |
| `medals` | `GET` | `/sportMonthlyCalendar` | `baseAxios` | Medal events monthly calendar |
| `sportsEgyption` | `GET` | `/olymbicSports` | `baseAxios` | Sports with Egyptian participation |
| `sportsEgyption` | `GET` | `/olymbicMatches` | `baseAxios` | Egyptian Olympic matches |
| `sportsEgyption` | `GET` | `/olymbicSportsWithPlayers` | `baseAxios` | Egyptian athletes per sport |
| `sportsEgyption` | `GET` | `/olymbicTournamentsWithSeasons`| `baseAxios` | Egyptian tournaments and seasons |

---

## 8. Subscriptions, Telco Operator & TPay

### 8.1 Multi-Service Telco Subscription
**File:** `src/services/Twist/subscription/index.js`  
*Used for channels: `rakam1` (local), `elmal3ab` (international), `el3almy` (africa), `othersports`, `mlokElkora` (meloukelkora), `befit` (fitness).*

| Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|
| `GET` | `/HeaderEnrichemnt/` | `baseHeaderEnrichmentAxios` | Mobile network header enrichment lookup |
| `POST` | `rakam1/header-enrichment/decrypt` | `baseSubscriptionAxios` | Decrypt MSISDN from header token |
| `POST` | `:service/subscription/checkSubscription` | `baseSubscriptionAxios` | Check MSISDN subscription status |
| `POST` | `:service/subscription/send-code` | `baseSubscriptionAxios` | Send SMS verification PIN to MSISDN |
| `POST` | `:service/subscription/check/pin` | `baseSubscriptionAxios` | Verify SMS PIN code |
| `POST` | `:service/subscription/updateToken` | `baseSubscriptionAxios` | Update subscriber auth session token |

### 8.2 New Subscription OTP Flow
**File:** `src/services/Twist/subscription/NewSubscription.js`

| Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|
| `POST` | `subscription/request-otp` | `baseNewSubscriptionAxios` | Request OTP for new subscription |
| `POST` | `subscription/verify-otp` | `baseNewSubscriptionAxios` | Verify OTP and activate subscription |

### 8.3 KSA TPay Direct Carrier Billing
**File:** `src/services/Twist/subscription/twistKsaTpay.js`

| Method | Endpoint | Base URL Client | Description |
|:---|:---|:---|:---|
| `POST` | `/tpay/verify-contract` | `baseAxios` | Verify TPay subscription contract |
| `POST` | `/tpay/resend-pin` | `baseAxios` | Resend TPay PIN code |
| `POST` | `/tpay/cancel` | `baseAxios` | Cancel TPay subscription contract |
| `POST` | `/tpay/auth/login` | `baseAxios` | Login via TPay MSISDN |
| `POST` | `/tpay/auth/register` | `baseAxios` | Register via TPay MSISDN |
| `POST` | `/tpay/auth/send-otp` | `baseAxios` | Send auth OTP |
| `POST` | `tpay/auth/verify-otp` | `baseAxios` | Verify auth OTP |
| `POST` | `tpay/auth/reset-password` | `baseAxios` | Reset password for TPay account |
| `GET` | `tpay/auth/exists` | `baseAxios` | Check if MSISDN exists and is subscribed |

---

## 9. Third-Party & Miscellaneous Services

| Source File | Method | Endpoint / URL | Description |
|:---|:---|:---|:---|
| `src/services/services.js` | `GET` | `/services` (`testBaseAxios`) | Get app services catalog |
| `src/layouts/Twist/index.jsx` | `GET` | `https://get.geojs.io/v1/ip/country.json` | IP-based country lookup |
| `src/hooks/useTPaySDK.js` | `GET` | `https://enrichment.tpay.me/idxml.ashx/v2/js` | TPay JavaScript enrichment SDK |
| `src/services/Twist/reports/index.js` | `GET` | `https://api.ipify.org/?format=json` | Client public IP detection |
