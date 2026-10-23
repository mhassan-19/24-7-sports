// Clean, sport-agnostic domain types. API quirks never reach this file (see packages/api).

export type Id = number;

/** `1` is football. Other sports reuse the same shapes with their own ids. */
export type SportId = number;
export const FOOTBALL: SportId = 1;

/** Wall-clock time in Egypt, `YYYY-MM-DDTHH:mm`. Format it without timezone conversion. */
export type EgyptDateTime = string;
/** An absolute instant, ISO 8601 with offset. Format it in `Africa/Cairo`. */
export type Instant = string;

export interface Paged<T> {
  items: T[];
  page: number;
  lastPage: number;
  total: number;
}

export interface Region {
  id: Id;
  nameAr: string;
  nameEn: string;
}

export interface TeamRef {
  id: Id;
  name: string;
  shortName: string | null;
  logo: string | null;
}

export interface CompetitionRef {
  id: Id;
  title: string;
  logo: string | null;
}

export interface Season {
  id: Id;
  title: string;
  active: boolean;
}

// ---------- Matches ----------

export type MatchState = 'scheduled' | 'live' | 'finished' | 'postponed';

export type MatchPhase =
  | 'first_half'
  | 'half_time'
  | 'second_half'
  | 'end_second_half'
  | 'extra_time_1'
  | 'end_extra_time_1'
  | 'extra_time_2'
  | 'end_extra_time_2'
  | 'penalties';

export interface MatchSide extends TeamRef {
  score: number | null;
  penalties: number | null;
}

export interface Match {
  id: Id;
  sportId: SportId;
  kickoff: EgyptDateTime;
  state: MatchState;
  /** Status text as returned by the API (Arabic). Shown when the state needs more detail. */
  statusLabel: string;
  phase: MatchPhase | null;
  /** Running clock while a half is being played; null at breaks and when not live. */
  clock: LiveClock | null;
  home: MatchSide;
  away: MatchSide;
  competition: CompetitionRef | null;
  stage: string | null;
  venue: string | null;
  regionIds: Id[];
}

/**
 * The API doesn't send the running minute, only when the current half started. The minute is
 * `base` + whole minutes since `startedAt` + 1, shown as "45+2" once it passes `cap`.
 */
export interface LiveClock {
  /** ISO instant the current half started. */
  startedAt: string;
  base: number;
  cap: number;
}

export interface DayMatches {
  yesterday: Match[];
  today: Match[];
  tomorrow: Match[];
}

export interface FixtureCalendar {
  previous: Match[];
  today: Match[];
  next: Match[];
}

export type MatchEventKind =
  | 'goal'
  | 'yellow_card'
  | 'red_card'
  | 'substitution'
  | 'var'
  | 'period'
  | 'other';

export interface MatchEvent {
  kind: MatchEventKind;
  /** Event name as returned by the API (Arabic). */
  label: string;
  minute: string | null;
  teamId: Id | null;
  player: { id: Id; name: string } | null;
  secondPlayer: { id: Id; name: string } | null;
}

export interface LineupPlayer {
  id: Id;
  name: string;
  number: number | null;
  /** Photo URL; null when the API only has its placeholder. */
  image: string | null;
  /** Only for players who played (starters, and substitutes who came on); never 0. */
  rating: number | null;
  goals: number;
  yellowCard: boolean;
  redCard: boolean;
  /** Minute the player was substituted (off for starters, on for subs). */
  subMinute: string | null;
}

export interface Lineup {
  teamId: Id;
  teamName: string;
  logo: string | null;
  hasLineup: boolean;
  formation: string | null;
  manager: string | null;
  /** Rows from the goalkeeper (index 0) to the attack. Empty rows are removed. */
  rows: LineupPlayer[][];
  subs: LineupPlayer[];
}

export type MatchStatKey =
  | 'possession'
  | 'shots'
  | 'shotsOnTarget'
  | 'corners'
  | 'fouls'
  | 'offsides'
  | 'passes'
  | 'yellowCards'
  | 'redCards';

export interface MatchStat {
  key: MatchStatKey;
  home: number;
  away: number;
}

export interface MatchDetail {
  match: Match;
  stats: MatchStat[];
}

export interface Meeting {
  id: Id;
  kickoff: EgyptDateTime;
  competition: CompetitionRef | null;
  venue: string | null;
  home: MatchSide;
  away: MatchSide;
}

export interface MeetingTotals {
  teamId: Id;
  teamName: string;
  shotsOnTarget: number;
  passes: number;
  yellowCards: number;
  redCards: number;
  passAccuracy: number;
}

export interface HeadToHead {
  meetings: Meeting[];
  totals: MeetingTotals[];
}

// ---------- Competitions ----------

export type CompetitionFormat = 'league' | 'cup';

export interface Competition extends CompetitionRef {
  sportId: SportId;
  regionId: Id | null;
  hasStandings: boolean;
  currentSeason: Season | null;
}

export interface CompetitionDetail extends Competition {
  format: CompetitionFormat;
  hasGroups: boolean;
  seasons: Season[];
  stages: { id: Id; name: string }[];
}

export type FormResult = 'W' | 'D' | 'L';

export interface StandingRow {
  position: number;
  team: TeamRef;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: FormResult[];
}

export interface StandingGroup {
  name: string | null;
  rows: StandingRow[];
}

export interface Standings {
  hasKnockout: boolean;
  groups: StandingGroup[];
}

export interface Leader {
  player: { id: Id; name: string; image: string | null };
  position: string | null;
  team: TeamRef | null;
  played: number | null;
  value: number;
}

export interface LeaderBoards {
  topScorers: Leader[];
  topAssists: Leader[];
  cleanSheets: Leader[];
  passes: Leader[];
}

export interface BracketMatch {
  id: Id;
  kickoff: EgyptDateTime;
  statusLabel: string;
  slot: number;
  teams: MatchSide[];
}

export interface BracketRound {
  id: Id;
  name: string;
  matches: BracketMatch[];
}

export interface CupProgress {
  percentage: number;
  stages: { name: string; total: number | null; completed: number | null }[];
}

export interface Honours {
  winners: { team: TeamRef; titles: number; seasons: string }[];
  lastWinner: TeamRef | null;
  mostTitles: TeamRef | null;
}

export interface TeamOfTheWeek {
  id: Id;
  week: number;
  weekName: string;
  image: string;
}

// ---------- Teams and players ----------

export interface Team extends TeamRef {
  manager: string | null;
  stadium: string | null;
  founded: string | null;
  competitions: CompetitionRef[];
  mainCompetitionId: Id | null;
  currentSeasonId: Id | null;
}

export type SquadPosition = 'goalkeepers' | 'defenders' | 'midfielders' | 'forwards';

export interface SquadPlayer {
  id: Id;
  name: string;
  number: number | null;
  age: number | null;
  nationality: string | null;
  image: string | null;
}

export interface SquadGroup {
  position: SquadPosition;
  players: SquadPlayer[];
}

export interface TeamStats {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  /** Goals per 15-minute interval, labels "15", "30" … "90". */
  byInterval: { label: string; goals: number }[];
}

export interface Gallery {
  id: Id;
  name: string;
  image: string | null;
  createdAt: string | null;
}

export interface Player {
  id: Id;
  name: string;
  image: string | null;
  age: number | null;
  birthDate: string | null;
  height: number | null;
  weight: number | null;
  nationality: string | null;
  position: string | null;
  shirtNumber: number | null;
  competitions: { id: Id; name: string; seasons: Season[] }[];
}

export interface PlayerStats {
  rating: number | null;
  goals: number;
  assists: number;
  matches: number;
  minutes: number;
  passAccuracy: number | null;
  attempts: number;
  ballWins: number;
  longBallAccuracy: number | null;
  saves: number;
}

export interface CareerEntry {
  teamId: Id;
  teamLogo: string | null;
  competitions: { id: Id; title: string; goals: number }[];
}

export interface Transfer {
  id: Id;
  player: { id: Id; name: string; image: string | null };
  age: number | null;
  fee: string | null;
  from: TeamRef;
  to: TeamRef;
  contract: string | null;
}

// ---------- Content ----------

export type TagKind = 'team' | 'player' | 'competition' | 'other';

export interface Tag {
  id: Id;
  kind: TagKind;
  title: string;
}

export interface ArticleSummary {
  id: Id;
  title: string;
  lead: string;
  publishedAt: EgyptDateTime;
  views: number;
  image: string | null;
  tags: Tag[];
}

export interface Article extends ArticleSummary {
  /** Raw HTML from the API. Sanitise before rendering. */
  bodyHtml: string;
  related: ArticleSummary[];
}

export type SearchKind = 'team' | 'player' | 'competition';

export interface SearchResult {
  id: Id;
  kind: SearchKind;
  name: string;
  image: string | null;
  subtitle: string | null;
}

export interface FeaturedHub {
  key: string;
  kind: 'team' | 'competition';
  id: Id;
  name: string;
  logo: string | null;
}

// ---------- Games ----------

export type GameType = 'guess' | 'match_predict' | 'team_squad';

export interface GameSummary {
  id: Id;
  title: string;
  image: string | null;
  type: GameType;
  played: boolean;
}

export interface LocalizedName {
  ar: string | null;
  en: string | null;
}

export interface GuessGame {
  type: 'guess';
  id: Id;
  title: string;
  question: string;
  questionImage: string | null;
  /** `correct` must only be shown after the answer is submitted. */
  choices: { id: Id; text: string; image: string | null; correct: boolean }[];
  played: boolean;
  answerPath: string;
}

export type PredictOutcome = 'home' | 'draw' | 'away';

export interface PredictFixture {
  id: Id;
  kickoff: Instant;
  home: { id: Id; name: LocalizedName; logo: string | null };
  away: { id: Id; name: LocalizedName; logo: string | null };
  venue: LocalizedName | null;
  locked: boolean;
  answered: boolean;
  yourPick: PredictOutcome | null;
  votes: { total: number; percent: Record<PredictOutcome, number> };
}

export interface PredictGame {
  type: 'match_predict';
  id: Id;
  title: string;
  competition: LocalizedName | null;
  outcomes: PredictOutcome[];
  fixtures: PredictFixture[];
  played: boolean;
  answerPath: string;
}

export type SquadGamePosition = 'goalkeeper' | 'defender' | 'midfielder' | 'forward';

export interface SquadGame {
  type: 'team_squad';
  id: Id;
  title: string;
  positions: SquadGamePosition[];
  players: { id: Id; name: string; position: SquadGamePosition; image: string | null }[];
  /** The API requires exactly this many players. */
  pickCount: number;
  played: boolean;
  answerPath: string;
}

export type GameDetail = GuessGame | PredictGame | SquadGame;
