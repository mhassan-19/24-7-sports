// TanStack Query hooks shared by web and mobile. Cache times follow
// docs/phase-1/05-technical-plan.md. Screens never call the API directly.
import { ApiError, type SeasonQuery, type SportsApi } from '@sports247/api';
import { liveMinute, type DayMatches, type Id, type Match, type MatchDetail, type PredictOutcome } from '@sports247/domain';
import {
  QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const SEC = 1000;
const MIN = 60 * SEC;

export interface DataConfig {
  api: SportsApi;
  /** Polling interval while a live match is on screen. */
  livePollMs: number;
  /** Anonymous device id sent as `user_identifier` for games. */
  guestId: string;
}

const DataContext = createContext<DataConfig | null>(null);

export function DataProvider({ value, children }: { value: DataConfig; children: ReactNode }) {
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataConfig(): DataConfig {
  const v = useContext(DataContext);
  if (!v) throw new Error('DataProvider is missing');
  return v;
}

/** No retries for 4xx (they won't change); two for network errors and 5xx. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && (error.kind === 'http' || error.kind === 'validation') && (error.status ?? 500) < 500) return false;
  if (error instanceof ApiError && error.kind === 'blocked') return false;
  return failureCount < 2;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: MIN, gcTime: 24 * 60 * MIN, refetchOnWindowFocus: true },
      mutations: { retry: false },
    },
  });
}

export const keys = {
  hubs: ['hubs'] as const,
  regions: ['regions'] as const,
  competitions: ['competitions'] as const,
  search: (q: string) => ['search', q] as const,
  dayMatches: ['matches', 'days'] as const,
  match: (id: Id) => ['match', id] as const,
  events: (id: Id) => ['match', id, 'events'] as const,
  lineups: (id: Id) => ['match', id, 'lineups'] as const,
  h2h: (id: Id) => ['match', id, 'h2h'] as const,
  matchNews: (id: Id) => ['match', id, 'news'] as const,
  competition: (id: Id) => ['competition', id] as const,
  season: (kind: string, q: SeasonQuery) => ['competition', q.competitionId, q.seasonId, kind] as const,
  honours: (id: Id) => ['competition', id, 'honours'] as const,
  teamOfTheWeek: (id: Id) => ['competition', id, 'totw'] as const,
  team: (id: Id) => ['team', id] as const,
  teamPart: (id: Id, part: string, extra?: unknown) => ['team', id, part, extra] as const,
  galleryImages: (id: Id) => ['gallery', id] as const,
  player: (id: Id) => ['player', id] as const,
  playerPart: (id: Id, part: string, extra?: unknown) => ['player', id, part, extra] as const,
  transfers: ['transfers'] as const,
  news: ['news'] as const,
  topStories: ['news', 'top'] as const,
  article: (id: Id) => ['article', id] as const,
  games: ['games'] as const,
  game: (id: Id) => ['game', id] as const,
};

const anyLive = (list: Match[] | undefined) => !!list?.some((m) => m.state === 'live');

// ---------- Config ----------

export function useFeaturedHubs() {
  const { api } = useDataConfig();
  return useQuery({ queryKey: keys.hubs, queryFn: api.featuredHubs, staleTime: 30 * MIN });
}

export function useRegions() {
  const { api } = useDataConfig();
  return useQuery({ queryKey: keys.regions, queryFn: api.regions, staleTime: 60 * MIN });
}

export function useCompetitions() {
  const { api } = useDataConfig();
  return useQuery({ queryKey: keys.competitions, queryFn: api.competitions, staleTime: 30 * MIN });
}

export function useSearch(query: string) {
  const { api } = useDataConfig();
  const q = query.trim();
  return useQuery({ queryKey: keys.search(q), queryFn: () => api.search(q), enabled: q.length >= 2, staleTime: 5 * MIN });
}

// ---------- Matches ----------

function useDayMatchesQuery(enabled: boolean) {
  const { api, livePollMs } = useDataConfig();
  return useQuery({
    queryKey: keys.dayMatches,
    queryFn: api.dayMatches,
    enabled,
    staleTime: MIN,
    refetchInterval: (q) => (anyLive(q.state.data?.today) || anyLive(q.state.data?.yesterday) ? livePollMs : false),
  });
}

export const useDayMatches = () => useDayMatchesQuery(true);

/**
 * The match endpoint has no phase or clock. While the match is live, take them from the day list
 * (homeCalendar), which has them and is polled anyway.
 */
export function withDayClock(detail: MatchDetail | undefined, days: DayMatches | undefined): MatchDetail | undefined {
  if (!detail || detail.match.state !== 'live' || !days) return detail;
  const id = detail.match.id;
  const fromDay = [...days.today, ...days.yesterday, ...days.tomorrow].find((m) => m.id === id);
  return fromDay ? { ...detail, match: { ...detail.match, phase: fromDay.phase, clock: fromDay.clock } } : detail;
}

export function useMatch(id: Id) {
  const { api, livePollMs } = useDataConfig();
  const detail = useQuery({
    queryKey: keys.match(id),
    queryFn: () => api.matchDetail(id),
    staleTime: 15 * SEC,
    refetchInterval: (q) => (q.state.data?.match.state === 'live' ? livePollMs : false),
  });
  const days = useDayMatchesQuery(detail.data?.match.state === 'live').data;
  const data = useMemo(() => withDayClock(detail.data, days), [detail.data, days]);
  return { ...detail, data } as typeof detail;
}

/** The live minute ("67", "45+2"), advancing on its own between polls; null when no clock runs. */
export function useLiveMinute(match: Pick<Match, 'state' | 'clock'>): string | null {
  const clock = match.state === 'live' ? match.clock : null;
  const [now, setNow] = useState(() => Date.now());
  const running = clock != null;
  useEffect(() => {
    if (!running) return;
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 10 * SEC);
    return () => clearInterval(t);
  }, [running]);
  return clock ? liveMinute(clock, now) : null;
}

/** Match parts refresh with the match while it is live. */
function useMatchPart<T>(key: readonly unknown[], fn: () => Promise<T>, live: boolean, enabled = true) {
  const { livePollMs } = useDataConfig();
  return useQuery({ queryKey: key, queryFn: fn, enabled, staleTime: live ? 15 * SEC : 5 * MIN, refetchInterval: live ? livePollMs : false });
}

export function useMatchEvents(id: Id, live: boolean, enabled = true) {
  const { api } = useDataConfig();
  return useMatchPart(keys.events(id), () => api.matchEvents(id), live, enabled);
}

export function useLineups(id: Id, live: boolean, enabled = true) {
  const { api } = useDataConfig();
  return useMatchPart(keys.lineups(id), () => api.lineups(id), live, enabled);
}

export function useHeadToHead(id: Id, enabled = true) {
  const { api } = useDataConfig();
  return useQuery({ queryKey: keys.h2h(id), queryFn: () => api.headToHead(id), enabled, staleTime: 30 * MIN });
}

export function useMatchNews(id: Id, enabled = true) {
  const { api } = useDataConfig();
  return useQuery({ queryKey: keys.matchNews(id), queryFn: () => api.matchNews(id), enabled, staleTime: 2 * MIN });
}

// ---------- Competitions ----------

export function useCompetition(id: Id) {
  const { api } = useDataConfig();
  return useQuery({ queryKey: keys.competition(id), queryFn: () => api.competition(id), staleTime: 30 * MIN });
}

export function useStandings(q: SeasonQuery | null, grouped = false) {
  const { api } = useDataConfig();
  return useQuery({
    queryKey: keys.season(grouped ? 'standings-groups' : 'standings', q ?? { competitionId: 0, seasonId: 0 }),
    queryFn: () => api.standings(q!, grouped),
    enabled: !!q,
    staleTime: 5 * MIN,
  });
}

export function useCompetitionCalendar(q: SeasonQuery | null) {
  const { api, livePollMs } = useDataConfig();
  return useQuery({
    queryKey: keys.season('calendar', q ?? { competitionId: 0, seasonId: 0 }),
    queryFn: () => api.competitionCalendar(q!),
    enabled: !!q,
    refetchInterval: (s) => (anyLive(s.state.data?.today) ? livePollMs : false),
  });
}

export function useCompetitionMatches(q: SeasonQuery | null) {
  const { api } = useDataConfig();
  return useInfiniteQuery({
    queryKey: keys.season('matches', q ?? { competitionId: 0, seasonId: 0 }),
    queryFn: ({ pageParam }) => api.competitionMatches(q!, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.lastPage ? last.page + 1 : undefined),
    enabled: !!q,
  });
}

export function useLeaderBoards(q: SeasonQuery | null) {
  const { api } = useDataConfig();
  return useQuery({
    queryKey: keys.season('leaders', q ?? { competitionId: 0, seasonId: 0 }),
    queryFn: () => api.leaderBoards(q!),
    enabled: !!q,
    staleTime: 5 * MIN,
  });
}

export function useTopList(q: SeasonQuery | null, kind: 'scorers' | 'assists') {
  const { api } = useDataConfig();
  return useQuery({
    queryKey: keys.season(`top-${kind}`, q ?? { competitionId: 0, seasonId: 0 }),
    queryFn: () => (kind === 'scorers' ? api.topScorers(q!) : api.topAssists(q!)),
    enabled: !!q,
    staleTime: 5 * MIN,
  });
}

export function useCompetitionTeams(q: SeasonQuery | null) {
  const { api } = useDataConfig();
  return useQuery({
    queryKey: keys.season('teams', q ?? { competitionId: 0, seasonId: 0 }),
    queryFn: () => api.competitionTeams(q!),
    enabled: !!q,
    staleTime: 30 * MIN,
  });
}

export function useBracket(q: SeasonQuery | null, enabled = true) {
  const { api } = useDataConfig();
  return useQuery({
    queryKey: keys.season('bracket', q ?? { competitionId: 0, seasonId: 0 }),
    queryFn: () => api.bracket(q!),
    enabled: !!q && enabled,
    staleTime: 5 * MIN,
  });
}

export function useCupProgress(q: SeasonQuery | null, enabled = true) {
  const { api } = useDataConfig();
  return useQuery({
    queryKey: keys.season('progress', q ?? { competitionId: 0, seasonId: 0 }),
    queryFn: () => api.cupProgress(q!),
    enabled: !!q && enabled,
    staleTime: 5 * MIN,
  });
}

export function useHonours(id: Id) {
  const { api } = useDataConfig();
  return useQuery({ queryKey: keys.honours(id), queryFn: () => api.honours(id), staleTime: 60 * MIN });
}

export function useTeamOfTheWeek(id: Id) {
  const { api } = useDataConfig();
  return useQuery({ queryKey: keys.teamOfTheWeek(id), queryFn: () => api.teamOfTheWeek(id), staleTime: 30 * MIN });
}

// ---------- Teams ----------

export function useTeam(id: Id) {
  const { api } = useDataConfig();
  return useQuery({ queryKey: keys.team(id), queryFn: () => api.team(id), staleTime: 30 * MIN });
}

export function useTeamCalendar(id: Id) {
  const { api, livePollMs } = useDataConfig();
  return useQuery({
    queryKey: keys.teamPart(id, 'calendar'),
    queryFn: () => api.teamCalendar(id),
    refetchInterval: (q) => (anyLive(q.state.data?.today) ? livePollMs : false),
  });
}

export function useSquad(id: Id, enabled = true) {
  const { api } = useDataConfig();
  return useQuery({ queryKey: keys.teamPart(id, 'squad'), queryFn: () => api.squad(id), enabled, staleTime: 30 * MIN });
}

export function useTeamStats(id: Id, q: SeasonQuery | null, enabled = true) {
  const { api } = useDataConfig();
  return useQuery({
    queryKey: keys.teamPart(id, 'stats', q),
    queryFn: () => api.teamStats(id, q!),
    enabled: !!q && enabled,
    staleTime: 5 * MIN,
  });
}

export function useGalleries(teamId: Id) {
  const { api } = useDataConfig();
  return useQuery({ queryKey: keys.teamPart(teamId, 'galleries'), queryFn: () => api.galleries(teamId), staleTime: 30 * MIN });
}

export function useGalleryImages(galleryId: Id | null) {
  const { api } = useDataConfig();
  return useQuery({
    queryKey: keys.galleryImages(galleryId ?? 0),
    queryFn: () => api.galleryImages(galleryId!),
    enabled: galleryId != null,
    staleTime: 60 * MIN,
  });
}

// ---------- Players ----------

export function usePlayer(id: Id) {
  const { api } = useDataConfig();
  return useQuery({ queryKey: keys.player(id), queryFn: () => api.player(id), staleTime: 30 * MIN });
}

export function usePlayerStats(id: Id, q: SeasonQuery | null) {
  const { api } = useDataConfig();
  return useQuery({
    queryKey: keys.playerPart(id, 'stats', q),
    queryFn: () => api.playerStats(id, q!),
    enabled: !!q,
    staleTime: 5 * MIN,
  });
}

export function useCareer(id: Id, enabled = true) {
  const { api } = useDataConfig();
  return useQuery({ queryKey: keys.playerPart(id, 'career'), queryFn: () => api.career(id), enabled, staleTime: 60 * MIN });
}

export function useTransfers() {
  const { api } = useDataConfig();
  return useInfiniteQuery({
    queryKey: keys.transfers,
    queryFn: ({ pageParam }) => api.transfers(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.lastPage ? last.page + 1 : undefined),
    staleTime: 10 * MIN,
  });
}

// ---------- News ----------

export function useNews() {
  const { api } = useDataConfig();
  return useInfiniteQuery({
    queryKey: keys.news,
    queryFn: ({ pageParam }) => api.news(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.lastPage ? last.page + 1 : undefined),
    staleTime: 2 * MIN,
  });
}

export function useTopStories() {
  const { api } = useDataConfig();
  return useQuery({ queryKey: keys.topStories, queryFn: api.topStories, staleTime: 2 * MIN });
}

export function useArticle(id: Id) {
  const { api } = useDataConfig();
  return useQuery({ queryKey: keys.article(id), queryFn: () => api.article(id), staleTime: 10 * MIN });
}

// ---------- Games ----------

export function useGames() {
  const { api } = useDataConfig();
  return useQuery({ queryKey: keys.games, queryFn: api.games, staleTime: 10 * MIN });
}

export function useGame(id: Id) {
  const { api, guestId } = useDataConfig();
  return useQuery({ queryKey: keys.game(id), queryFn: () => api.game(id, guestId), staleTime: MIN });
}

function useGameMutation<V>(gameId: Id, fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.game(gameId) });
      void qc.invalidateQueries({ queryKey: keys.games });
    },
  });
}

export function useAnswerGuess(gameId: Id, answerPath: string) {
  const { api, guestId } = useDataConfig();
  return useGameMutation(gameId, (choiceId: Id) => api.answerGuess(answerPath, guestId, choiceId));
}

export function useAnswerPrediction(gameId: Id, answerPath: string) {
  const { api, guestId } = useDataConfig();
  return useGameMutation(gameId, (picks: { fixtureId: Id; outcome: PredictOutcome; teamId: Id | null }[]) =>
    Promise.all(picks.map((p) => api.answerPrediction(answerPath, guestId, p.fixtureId, p.outcome, p.teamId))),
  );
}

export function useAnswerSquad(gameId: Id, answerPath: string) {
  const { api, guestId } = useDataConfig();
  return useGameMutation(gameId, (playerIds: Id[]) => api.answerSquad(answerPath, guestId, playerIds));
}
