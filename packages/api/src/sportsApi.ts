// One function per verified endpoint (docs/api/API_AUDIT.md). Each returns domain types.
import type { Id, PredictOutcome } from '@sports247/domain';
import type { ApiClient } from './client';
import * as m from './mappers';

export interface SeasonQuery {
  competitionId: Id;
  seasonId: Id;
}

const season = (q: SeasonQuery) => ({ tournament_id: q.competitionId, season_id: q.seasonId });

export function createSportsApi(client: ApiClient) {
  const get = client.get;
  return {
    // Config and taxonomy
    featuredHubs: async () => m.mapHubs(await get('global-config')),
    regions: async () => m.mapRegions(await get('services')),
    competitions: async () => m.mapCompetitions(await get('activeTournaments')),
    search: async (keyword: string) => m.mapSearch(await get('full-search', { keyword })),

    // Matches
    dayMatches: async () => m.mapDayMatches(await get('homeCalendar')),
    matchDetail: async (id: Id) => m.mapMatchDetail(await get('matchStatistics', { match_id: id })),
    matchEvents: async (id: Id) => m.mapEvents(await get('match_events', { match_id: id })),
    lineups: async (id: Id) => m.mapLineups(await get(`newLineup/${id}`)),
    headToHead: async (id: Id) => m.mapHeadToHead(await get('newLatest-matches-for-teams', { match_id: id }), id),
    matchNews: async (id: Id) => m.mapArticleList(await get('matchMedia', { match_id: id })),

    // Competitions
    competition: async (id: Id) => m.mapCompetitionDetail(await get(`tournaments/${id}`)),
    /** Group competitions use `tournament/standing` (groups with names); leagues and fallbacks use `teamsStanding`. */
    standings: async (q: SeasonQuery, grouped = false) => {
      if (grouped) {
        const g = m.mapGroupStandings(await get('tournament/standing', season(q)));
        if (g.groups.length) return g;
      }
      return m.mapStandings(await get('teamsStanding', season(q)));
    },
    competitionCalendar: async (q: SeasonQuery) => m.mapCalendar(await get('tournamentCalendar', season(q))),
    competitionMatches: async (q: SeasonQuery, page = 1) =>
      m.mapPaged((await get<{ data: unknown }>('tournament/matches', { ...season(q), page })).data, m.mapMatch),
    leaderBoards: async (q: SeasonQuery, count = 5) =>
      m.mapLeaderBoards(await get('topLeaguePlayers', { ...season(q), items_count: count })),
    topScorers: async (q: SeasonQuery) => m.mapTopList(await get('top-scorers', season(q)), 'scorers'),
    topAssists: async (q: SeasonQuery) => m.mapTopList(await get('top-assists', season(q)), 'assists'),
    competitionTeams: async (q: SeasonQuery) => m.mapTeams(await get('tournament-teams', season(q))),
    bracket: async (q: SeasonQuery) => m.mapBracket(await get('knockout-stage-bracket', season(q))),
    cupProgress: async (q: SeasonQuery) => m.mapCupProgress(await get('tournament-progress', season(q))),
    honours: async (id: Id) => {
      const [history, mostLast] = await Promise.all([
        get(`tournament-history/${id}`),
        get('tournament-most-last-winner', { tournament_id: id }),
      ]);
      return m.mapHonours(history, mostLast);
    },
    teamOfTheWeek: async (id: Id) => m.mapTeamOfTheWeek(await get('team-of-the-week', { tournament_id: id })),

    // Teams
    team: async (id: Id) => m.mapTeam(await get(`teams/${id}`)),
    teamCalendar: async (id: Id) => m.mapCalendar(await get('teamCalendar', { team_id: id })),
    squad: async (id: Id) => m.mapSquad(await get(`teams/${id}/squad`)),
    teamStats: async (id: Id, q: SeasonQuery) =>
      m.mapTeamStats(await get('teamStatistics', { team_id: id, ...season(q) })),
    galleries: async (teamId: Id) => m.mapGalleries(await get(`al-ahly/galleryList/${teamId}`)),
    galleryImages: async (galleryId: Id) => m.mapGalleryImages(await get(`teamGallery/${galleryId}`)),

    // Players
    player: async (id: Id) => m.mapPlayer(await get(`players/${id}/details`)),
    playerStats: async (id: Id, q: SeasonQuery) => m.mapPlayerStats(await get(`players/${id}/statistics`, season(q))),
    career: async (id: Id) => m.mapCareer(await get(`player-history-details/${id}`)),
    transfers: async (page = 1) => m.mapTransfers(await get('transferes', { page })),

    // News
    news: async (page = 1) => m.mapNewsPage(await get('media', { page })),
    topStories: async () => m.mapArticleList(await get('mixMedia')),
    article: async (id: Id) => m.mapArticle(await get(`media/${id}`)),

    // Games
    games: async () => m.mapGames(await get('games')),
    game: async (id: Id, userIdentifier: string) => m.mapGame(await get(`games/${id}`, { user_identifier: userIdentifier })),
    answerGuess: (answerPath: string, userIdentifier: string, choiceId: Id) =>
      client.postForm(answerPath, { user_identifier: userIdentifier, guess_game_choice_id: choiceId }),
    /**
     * Body confirmed only up to `game_fixture_id` (TEST fixtures were closed). Postman documents
     * `predicted_team_id`; `outcome` is sent too so a draw can be expressed. Pending backend (N1).
     */
    answerPrediction: (
      answerPath: string,
      userIdentifier: string,
      fixtureId: Id,
      outcome: PredictOutcome,
      teamId: Id | null,
    ) =>
      client.postForm(answerPath, {
        user_identifier: userIdentifier,
        game_fixture_id: fixtureId,
        outcome,
        predicted_team_id: teamId,
      }),
    answerSquad: (answerPath: string, userIdentifier: string, playerIds: Id[]) =>
      client.postForm(answerPath, { user_identifier: userIdentifier, answer: playerIds }),
  };
}

export type SportsApi = ReturnType<typeof createSportsApi>;
