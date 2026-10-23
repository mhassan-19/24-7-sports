// Raw API payload → clean domain types. Every API quirk (typos, envelope styles, string numbers)
// is absorbed here. Field names were taken from recorded TEST responses (test/fixtures).
import {
  clockForPhase,
  eventKindFromId,
  isFormResult,
  matchStateFromStatus,
  phaseFromCode,
  sortMatches,
} from '@sports247/domain';
import type {
  Article,
  ArticleSummary,
  BracketRound,
  CareerEntry,
  Competition,
  CompetitionDetail,
  CompetitionRef,
  CupProgress,
  DayMatches,
  FeaturedHub,
  FixtureCalendar,
  Gallery,
  GameDetail,
  GameSummary,
  GameType,
  HeadToHead,
  Id,
  Honours,
  Leader,
  LeaderBoards,
  LineupPlayer,
  Lineup,
  LocalizedName,
  Match,
  MatchDetail,
  MatchEvent,
  MatchSide,
  MatchStat,
  MatchStatKey,
  Paged,
  Player,
  PlayerStats,
  PredictOutcome,
  Region,
  SearchResult,
  Season,
  SquadGamePosition,
  SquadGroup,
  SquadPosition,
  Standings,
  Tag,
  Team,
  TeamOfTheWeek,
  TeamRef,
  TeamStats,
  Transfer,
} from '@sports247/domain';
import type { Raw } from './read';
import { apiInstant, arr, bool, data, egyptDateTime, img, num, num0, obj, objs, pos, str, str0 } from './read';

// ---------- Shared ----------

export function mapPaged<T>(container: unknown, map: (r: Raw) => T): Paged<T> {
  const c = obj(container);
  const meta = obj(c.meta);
  return {
    items: objs(c.data).map(map),
    page: num(meta.current_page) ?? 1,
    lastPage: num(meta.last_page) ?? 1,
    total: num(meta.total) ?? objs(c.data).length,
  };
}

export const mapSeason = (r: Raw): Season => ({
  id: num0(r.id),
  title: str0(r.title ?? r.name),
  active: bool(r.active ?? r.is_active),
});

const competitionRef = (r: Raw): CompetitionRef | null =>
  num(r.id) == null ? null : { id: num0(r.id), title: str0(r.title ?? r.name), logo: img(r.logo) };

const teamRef = (r: Raw): TeamRef => ({
  id: num0(r.id),
  name: str0(r.title ?? r.name),
  shortName: str(r.short_name),
  logo: img(r.logo),
});

const side = (r: Raw): MatchSide => ({
  ...teamRef(r),
  score: num(r.score),
  penalties: num(r.penalty_score),
});

// ---------- Matches ----------

export function mapMatch(r: Raw): Match {
  const round = obj(r.matchRoundInfo);
  const state = matchStateFromStatus(num(r.matchStatus));
  // `round.time` is the minute the half started at, not the running minute.
  const phase = state === 'live' ? phaseFromCode(num(round.event_id)) : null;
  return {
    id: num0(r.id),
    sportId: num(r.sport_id) ?? 1,
    kickoff: egyptDateTime(r.date),
    state,
    statusLabel: str0(r.status),
    phase,
    clock: clockForPhase(phase, apiInstant(round.created_at)),
    home: side(obj(r.team1)),
    away: side(obj(r.team2)),
    competition: competitionRef(obj(r.tournament)),
    stage: str(obj(r.stage).title),
    venue: str(r.stadium),
    regionIds: arr(r.services).map(num).filter((x): x is number => x != null),
  };
}

const matches = (v: unknown) => sortMatches(objs(v).map(mapMatch));

export function mapDayMatches(body: unknown): DayMatches {
  const d = obj(data(body));
  return { yesterday: matches(d.yesterday), today: matches(d.today), tomorrow: matches(d.tomorrow) };
}

export function mapCalendar(body: unknown): FixtureCalendar {
  const d = obj(data(body));
  return { previous: objs(d.previous).map(mapMatch), today: matches(d.today), next: objs(d.next).map(mapMatch) };
}

const STAT_KEYS: [MatchStatKey, string][] = [
  ['possession', 'possession'],
  ['shots', 'shots'],
  ['shotsOnTarget', 'target_shots'],
  ['corners', 'corners'],
  ['fouls', 'fouls'],
  ['offsides', 'offsides'],
  ['passes', 'pass'],
  ['yellowCards', 'yellow_cards'],
  ['redCards', 'red_cards'],
];

export function mapMatchDetail(body: unknown): MatchDetail {
  const d = obj(data(body));
  const a = obj(arr(obj(d.team1).statistics)[0]);
  const b = obj(arr(obj(d.team2).statistics)[0]);
  const hasStats = Object.keys(a).length > 0 || Object.keys(b).length > 0;
  const stats: MatchStat[] = hasStats
    ? STAT_KEYS.map(([key, raw]) => ({ key, home: num0(a[raw]), away: num0(b[raw]) }))
    : [];
  return { match: mapMatch(d), stats };
}

export function mapEvents(body: unknown): MatchEvent[] {
  return objs(data(body)).map((e) => {
    const p1 = num(e.playerOne_id);
    const p2 = num(e.playerTwo_id);
    return {
      kind: eventKindFromId(num0(e.event_id), p1 != null),
      label: str0(e.event_name ?? e.title),
      minute: str(e.event_time) ?? str(e.time),
      teamId: num(e.team_id),
      player: p1 != null ? { id: p1, name: str0(e.playerOne_name) } : null,
      secondPlayer: p2 != null ? { id: p2, name: str0(e.playerTwo_name) } : null,
    };
  });
}

const PITCH_ROWS = ['goal', 'defence', 'midp1', 'midp2', 'midp3', 'attack'];

/**
 * Unused substitutes sometimes carry a rating from the data provider (seen on PROD), and players
 * without one get 0, so a rating shows only for players who played and never as 0.
 */
function lineupPlayer(r: Raw, sub: boolean): LineupPlayer {
  const ev = obj(r.playerMatchEvents);
  const played = !sub || bool(ev.hasexchanged);
  return {
    id: num0(r.player_id),
    name: str0(r.player_name),
    number: num(r.shirt_number),
    image: img(r.image),
    rating: played ? pos(r.rating) : null,
    goals: num0(ev.goalsCount),
    yellowCard: bool(ev.hasYellowCard) || bool(ev.has2YellowCard),
    redCard: bool(ev.hasRedCard),
    subMinute: bool(ev.hasexchanged) ? str(ev.event_time) : null,
  };
}

export function mapLineups(body: unknown): Lineup[] {
  return objs(data(body)).map((t) => {
    const pitch = obj(t.pitch);
    return {
      teamId: num0(t.team_id),
      teamName: str0(t.team_name),
      logo: img(t.logo),
      hasLineup: bool(t.has_lineup),
      formation: str(t.plan),
      manager: str(obj(t.manager).name),
      rows: PITCH_ROWS.map((k) => objs(pitch[k]).map((p) => lineupPlayer(p, false))).filter((row) => row.length > 0),
      subs: objs(t.subs).map((p) => lineupPlayer(p, true)),
    };
  });
}

/**
 * Past meetings only, newest first. The list can include the match itself and future fixtures
 * between the two teams (no score yet), which aren't previous meetings.
 */
export function mapHeadToHead(body: unknown, matchId?: Id): HeadToHead {
  const b = obj(body);
  return {
    meetings: objs(b.data)
      .map((m) => ({
        id: num0(m.id),
        kickoff: egyptDateTime(m.date),
        competition: competitionRef(obj(m.tournament)),
        venue: str(m.stadium),
        home: side(obj(m.team1)),
        away: side(obj(m.team2)),
      }))
      .filter((m) => m.id !== matchId && m.home.score != null && m.away.score != null)
      .sort((x, y) => y.kickoff.localeCompare(x.kickoff)),
    totals: objs(b.stats).map((s) => ({
      teamId: num0(s.team_id),
      teamName: str0(s.team_name),
      shotsOnTarget: num0(s.total_target_shots),
      passes: num0(s.total_passes),
      yellowCards: num0(s.total_yellow_cards),
      redCards: num0(s.total_red_cards),
      passAccuracy: num0(s.average_pass_accuracy),
    })),
  };
}

// ---------- Content ----------

const TAG_KINDS: Record<string, Tag['kind']> = { Team: 'team', Player: 'player', Tournament: 'competition' };

const mapTag = (t: Raw): Tag => ({
  id: num0(t.tagable_id),
  kind: TAG_KINDS[str0(t.type).split('\\').pop() ?? ''] ?? 'other',
  title: str0(t.title),
});

export const mapArticleSummary = (r: Raw): ArticleSummary => ({
  id: num0(r.id),
  title: str0(r.title),
  lead: str0(r.lead),
  publishedAt: egyptDateTime(r.date),
  views: num0(r.views),
  image: img(r.media) ?? img(r.video_cover),
  tags: objs(r.tags).map(mapTag),
});

export function mapArticle(body: unknown): Article {
  const d = obj(data(body));
  return {
    ...mapArticleSummary(d),
    bodyHtml: str0(d.description),
    related: objs(d.related).map(mapArticleSummary),
  };
}

export const mapNewsPage = (body: unknown): Paged<ArticleSummary> => mapPaged(data(body), mapArticleSummary);
export const mapArticleList = (body: unknown): ArticleSummary[] => objs(data(body)).map(mapArticleSummary);

// ---------- Config, regions, search ----------

/** `global-config` keys → what they point at. Unknown keys are treated as competitions. */
const HUB_KIND: Record<string, FeaturedHub['kind']> = { al_ahly: 'team', egypt: 'team' };

export function mapHubs(body: unknown): FeaturedHub[] {
  return Object.entries(obj(data(body)))
    .filter(([, v]) => v && typeof v === 'object')
    .map(([key, v]) => {
      const r = obj(v);
      return { key, kind: HUB_KIND[key] ?? 'competition', id: num0(r.id), name: str0(r.name), logo: img(r.logo) };
    });
}

export const mapRegions = (body: unknown): Region[] =>
  objs(data(body))
    .filter((r) => bool(r.is_active))
    .map((r) => ({ id: num0(r.id), nameAr: str0(r.name_ar), nameEn: str0(r.name_en) }));

const SEARCH_KINDS: Record<string, SearchResult['kind']> = { team: 'team', player: 'player', tournament: 'competition' };

export const mapSearch = (body: unknown): SearchResult[] =>
  objs(data(body))
    .filter((r) => SEARCH_KINDS[str0(r.type)])
    .map((r) => ({
      id: num0(r.id),
      kind: SEARCH_KINDS[str0(r.type)]!,
      name: str0(r.name),
      image: img(r.image),
      subtitle: str(obj(r.main_tournament).title),
    }));

// ---------- Competitions ----------

export const mapCompetition = (r: Raw): Competition => ({
  id: num0(r.id),
  title: str0(r.title),
  logo: img(r.logo),
  sportId: num(r.sport_id) ?? 1,
  regionId: num(r.service_id),
  hasStandings: bool(r.has_standing),
  currentSeason: r.currentSeason ? mapSeason(obj(r.currentSeason)) : null,
});

export const mapCompetitions = (body: unknown): Competition[] => objs(data(body)).map(mapCompetition);

export function mapCompetitionDetail(body: unknown): CompetitionDetail {
  const d = obj(data(body));
  const cur = obj(d.current_season);
  const seasons = objs(d.seasons).map(mapSeason);
  const isCup = /cup/i.test(str0(d.type));
  return {
    id: num0(d.id),
    title: str0(d.title),
    logo: img(d.logo),
    sportId: num(d.sport_id) ?? 1,
    regionId: num(d.service_id),
    hasStandings: !isCup || bool(d.has_group),
    currentSeason: num(cur.id) != null ? mapSeason(cur) : (seasons.find((s) => s.active) ?? seasons[0] ?? null),
    format: isCup ? 'cup' : 'league',
    hasGroups: bool(d.has_group),
    seasons,
    stages: objs(cur.season_stages)
      .map((s) => obj(s.stage))
      .map((s) => ({ id: num0(s.id), name: str0(s.name_ar ?? s.name_en) })),
  };
}

const standingRow = (r: Raw, i: number) => ({
  position: i + 1,
  team: { id: num0(r.team_id), name: str0(r.team_name), shortName: null, logo: img(r.team_logo) },
  played: num0(r.played),
  goalsFor: num0(r.goals_in),
  goalsAgainst: num0(r.goals_out),
  points: num0(r.point),
  form: objs(r.lastStatus).map((x) => x.status).filter(isFormResult),
});

/** `teamsStanding`: one flat table (leagues). For group competitions it has no group labels. */
export function mapStandings(body: unknown): Standings {
  const t = obj(objs(data(body))[0]);
  const rows = objs(obj(t.data).standing).map(standingRow);
  return { hasKnockout: bool(t.has_tree), groups: rows.length ? [{ name: null, rows }] : [] };
}

/**
 * `tournament/standing`: `group_stage[]` with a title and its teams (World Cup, AFCON, …),
 * including the best-third-placed table. Empty for leagues. Team order is the API ranking.
 */
export function mapGroupStandings(body: unknown): Standings {
  const d = obj(data(body));
  const groups = objs(d.group_stage)
    .map((g) => ({ name: str(g.title), rows: objs(g.teams).map(standingRow) }))
    .filter((g) => g.rows.length > 0);
  return { hasKnockout: bool(d.has_tree), groups };
}

const leader = (valueKey: string) => (r: Raw): Leader => ({
  player: { id: num0(r.id), name: str0(r.name), image: img(r.image) },
  position: str(r.player_position ?? r.position),
  team: num(r.team_id) != null ? { id: num0(r.team_id), name: str0(r.team_name), shortName: null, logo: img(r.team_logo) } : null,
  played: num(r.played),
  value: num0(r[valueKey]),
});

export function mapLeaderBoards(body: unknown): LeaderBoards {
  const d = obj(data(body));
  return {
    topScorers: objs(d.topScorers).map(leader('goals')),
    topAssists: objs(d.topAssists).map(leader('assissts')),
    cleanSheets: objs(d.topCleanSheats).map(leader('clean_sheets')),
    passes: objs(d.topPassers).map(leader('passes')),
  };
}

export const mapTopList = (body: unknown, kind: 'scorers' | 'assists'): Leader[] =>
  objs(data(body)).map(leader(kind === 'scorers' ? 'goals' : 'assissts'));

export const mapTeams = (body: unknown): TeamRef[] => objs(data(body)).map(teamRef);

export const mapBracket = (body: unknown): BracketRound[] =>
  objs(data(body)).map((round) => ({
    id: num0(round.id),
    name: str0(round.title),
    matches: objs(round.matches)
      .map((m) => ({
        id: num0(m.id),
        kickoff: egyptDateTime(m.start_date),
        statusLabel: str0(m.status),
        slot: num0(m.tree_position),
        teams: objs(m.teams).map(side),
      }))
      .sort((a, b) => a.slot - b.slot),
  }));

export function mapCupProgress(body: unknown): CupProgress {
  const d = obj(data(body));
  return {
    percentage: num0(d.total_percentage),
    stages: objs(d.stages).map((s) => ({
      name: str0(s.stage_name),
      total: num(s.total_matches),
      completed: num(s.completed_matches),
    })),
  };
}

export function mapHonours(history: unknown, mostLast: unknown): Honours {
  const h = obj(data(history));
  const ml = obj(data(mostLast));
  const ref = (v: unknown) => (num(obj(v).id) != null ? teamRef(obj(v)) : null);
  return {
    winners: objs(h.winners).map((w) => ({ team: teamRef(w), titles: num0(w.count), seasons: str0(w.seasons) })),
    lastWinner: ref(ml.last_winner),
    mostTitles: ref(ml.most_winner),
  };
}

export const mapTeamOfTheWeek = (body: unknown): TeamOfTheWeek[] =>
  objs(data(body))
    .filter((r) => img(r.image))
    .map((r) => ({
      id: num0(r.id),
      week: num0(obj(r.week).number),
      weekName: str0(obj(r.week).name),
      image: img(r.image)!,
    }));

// ---------- Teams ----------

export function mapTeam(body: unknown): Team {
  const d = obj(data(body));
  return {
    ...teamRef(d),
    name: str0(d.name ?? d.title),
    manager: str(obj(d.manager).name),
    stadium: str(d.stadium),
    founded: str(d.founded),
    competitions: objs(d.tournaments).map(competitionRef).filter((c): c is CompetitionRef => c != null),
    mainCompetitionId: num(d.main_tournament_id),
    currentSeasonId: num(d.current_season_id),
  };
}

const SQUAD_ORDER: SquadPosition[] = ['goalkeepers', 'defenders', 'midfielders', 'forwards'];

export function mapSquad(body: unknown): SquadGroup[] {
  const players = obj(obj(data(body)).players);
  return SQUAD_ORDER.map((position) => ({
    position,
    players: objs(players[position]).map((p) => ({
      id: num0(p.id),
      name: str0(p.name),
      number: num(p.shirt_number),
      age: pos(p.age),
      nationality: str(obj(p.nationality).title),
      image: img(p.image),
    })),
  })).filter((g) => g.players.length > 0);
}

export function mapTeamStats(body: unknown): TeamStats {
  const d = obj(data(body));
  return {
    played: num0(d.played),
    won: num0(d.win),
    drawn: num0(d.draw),
    lost: num0(d.lose),
    goalsFor: num0(d.goals_in),
    goalsAgainst: num0(d.goals_out),
    cleanSheets: num0(d.clean_sheet),
    yellowCards: num0(d.yellow_cards),
    redCards: num0(d.red_cards),
    byInterval: Object.entries(obj(d.scoringIntervals)).map(([k, v]) => ({ label: k.replace(/\D/g, ''), goals: num0(v) })),
  };
}

export const mapGalleries = (body: unknown): Gallery[] =>
  objs(data(body)).map((g) => ({ id: num0(g.id), name: str0(g.name), image: img(g.image), createdAt: str(g.created_at) }));

export const mapGalleryImages = (body: unknown): string[] =>
  arr(obj(data(body)).images).map(img).filter((x): x is string => x != null);

// ---------- Players ----------

export function mapPlayer(body: unknown): Player {
  const d = obj(data(body));
  return {
    id: num0(d.id),
    name: str0(d.name),
    image: img(d.image),
    age: pos(d.age),
    birthDate: str(d.birth_date),
    height: pos(d.height),
    weight: pos(d.weight),
    nationality: str(obj(d.nationality).title),
    position: str(d.position),
    shirtNumber: num(d.shirt_number),
    competitions: objs(d.tournamentsData).map((t) => ({
      id: num0(t.id),
      name: str0(t.name),
      seasons: objs(t.seasons).map(mapSeason),
    })),
  };
}

export function mapPlayerStats(body: unknown): PlayerStats {
  const d = obj(data(body));
  return {
    rating: pos(d.rating),
    goals: num0(d.goalsCount),
    assists: num0(d.assisstsCount),
    matches: num0(d.playedMatchesCount),
    minutes: num0(d.playedMinutesCount),
    passAccuracy: pos(d.passAccuracy),
    attempts: num0(d.attemptsCount),
    ballWins: num0(d.ballWinCount),
    longBallAccuracy: pos(d.longBallAccuracy),
    saves: num0(d.savesCount),
  };
}

export const mapCareer = (body: unknown): CareerEntry[] =>
  objs(data(body)).map((c) => ({
    teamId: num0(c.team_id),
    teamLogo: img(c.team_logo),
    competitions: objs(c.tournamentsStats).map((t) => ({ id: num0(t.id), title: str0(t.title), goals: num0(t.goals) })),
  }));

export const mapTransfers = (body: unknown): Paged<Transfer> =>
  mapPaged(body, (t) => ({
    id: num0(t.id),
    player: { id: num0(t.player_id), name: str0(t.player), image: img(t.player_logo) },
    age: pos(t.age),
    fee: str(t.price) === '0' ? null : str(t.price),
    from: { id: num0(t.from_team_id), name: str0(t.from_team), shortName: null, logo: img(t.from_team_logo) },
    to: { id: num0(t.to_team_id), name: str0(t.to_team), shortName: null, logo: img(t.to_team_logo) },
    contract: str(obj(t.type).name),
  }));

// ---------- Games ----------

const GAME_TYPES: GameType[] = ['guess', 'match_predict', 'team_squad'];
const isGameType = (v: unknown): v is GameType => GAME_TYPES.includes(v as GameType);

/** Games of an unknown type are dropped: there is no screen for them. */
export const mapGames = (body: unknown): GameSummary[] =>
  objs(obj(body).games)
    .filter((g) => isGameType(g.type) && g.is_active !== false)
    .map((g) => ({ id: num0(g.id), title: str0(g.title), image: img(g.image), type: g.type as GameType, played: bool(g.is_played) }));

const localized = (r: Raw): LocalizedName => ({ ar: str(r.name_ar), en: str(r.name_en) });
const OUTCOMES: PredictOutcome[] = ['home', 'draw', 'away'];
const isOutcome = (v: unknown): v is PredictOutcome => OUTCOMES.includes(v as PredictOutcome);
const SQUAD_POSITIONS: SquadGamePosition[] = ['goalkeeper', 'defender', 'midfielder', 'forward'];
const isSquadPosition = (v: unknown): v is SquadGamePosition => SQUAD_POSITIONS.includes(v as SquadGamePosition);

/** The squad game answer must contain exactly this many players (API validation). */
export const SQUAD_PICK_COUNT = 11;

export function mapGame(body: unknown): GameDetail | null {
  const b = obj(body);
  const played = bool(b.is_played);
  const answerPath = str0(b.answer_endpoint);
  if (b.type === 'guess') {
    const g = obj(b.guess_game);
    return {
      type: 'guess',
      id: num0(g.id),
      title: str0(g.title),
      question: str0(g.question),
      questionImage: img(g.question_image),
      // The API exposes `is_correct` before answering (reported to backend). The UI only reveals
      // it after the answer has been submitted.
      choices: objs(b.choices).map((c) => ({ id: num0(c.id), text: str0(c.text), image: img(c.image), correct: bool(c.is_correct) })),
      played,
      answerPath,
    };
  }
  if (b.type === 'match_predict') {
    const g = obj(b.match_predict_game);
    return {
      type: 'match_predict',
      id: num0(g.id),
      title: str0(obj(g.game).title),
      competition: g.tournament ? localized(obj(g.tournament)) : null,
      outcomes: objs(g.outcomes).map((o) => o.value).filter(isOutcome),
      fixtures: objs(b.fixtures).map((f) => {
        const fx = obj(f.fixture);
        const pct = obj(obj(f.stats).percentages);
        const team = (t: Raw) => ({ id: num0(t.id), name: localized(t), logo: img(t.logo) });
        return {
          id: num0(f.game_fixture_id),
          kickoff: str0(fx.match_datetime),
          home: team(obj(fx.home_team)),
          away: team(obj(fx.away_team)),
          venue: fx.stadium ? localized(obj(fx.stadium)) : null,
          locked: bool(f.is_locked),
          answered: bool(f.is_answered),
          yourPick: isOutcome(f.your_pick) ? f.your_pick : null,
          votes: { total: num0(obj(f.stats).total), percent: { home: num0(pct.home), draw: num0(pct.draw), away: num0(pct.away) } },
        };
      }),
      played,
      answerPath,
    };
  }
  if (b.type === 'team_squad') {
    const g = obj(b.team_squad_game);
    return {
      type: 'team_squad',
      id: num0(g.id),
      title: str0(obj(g.game).title),
      positions: objs(g.positions).map((p) => p.value).filter(isSquadPosition),
      players: objs(b.players)
        .filter((p) => isSquadPosition(p.position))
        .map((p) => ({ id: num0(p.id), name: str0(p.name), position: p.position as SquadGamePosition, image: img(p.image) })),
      pickCount: SQUAD_PICK_COUNT,
      played,
      answerPath,
    };
  }
  return null;
}
