import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as m from '../src/mappers';

const fx = (name: string): unknown =>
  JSON.parse(readFileSync(join(import.meta.dirname, 'fixtures', `${name}.json`), 'utf8'));

describe('matches', () => {
  const detail = m.mapMatchDetail(fx('match-stats-2578'));

  it('maps a finished match with Egypt wall-clock kickoff', () => {
    expect(detail.match).toMatchObject({
      id: 2578,
      state: 'finished',
      // API 23:00 at UTC+3 is 22:00 in Cairo in January (UTC+2).
      kickoff: '2026-01-19T22:00',
      phase: null,
      home: { id: 26, shortName: 'Brighton', score: 1 },
      away: { id: 22, shortName: 'Bournemouth', score: 1 },
      competition: { id: 3 },
    });
  });

  it('maps statistics for both teams with clean keys', () => {
    const possession = detail.stats.find((s) => s.key === 'possession');
    expect(possession).toEqual({ key: 'possession', home: 66, away: 34 });
    expect(detail.stats.map((s) => s.key)).toContain('shotsOnTarget');
  });

  it('maps the empty home calendar from TEST', () => {
    expect(m.mapDayMatches(fx('home-calendar'))).toEqual({ yesterday: [], today: [], tomorrow: [] });
  });

  it('maps events, keeping period markers and player names', () => {
    const events = m.mapEvents(fx('match-events-2578'));
    expect(events[0]).toMatchObject({ kind: 'period', player: null });
    expect(events.some((e) => e.kind === 'goal' && e.player)).toBe(true);
  });

  it('maps lineups from goalkeeper to attack and drops empty rows', () => {
    const [first] = m.mapLineups(fx('lineup-2578'));
    expect(first!.formation).toBe('4-2-3-1');
    expect(first!.rows[0]).toHaveLength(1);
    expect(first!.rows.every((r) => r.length > 0)).toBe(true);
    expect(first!.rows.flat()).toHaveLength(11);
  });

  it('maps head to head meetings and totals', () => {
    const h2h = m.mapHeadToHead(fx('h2h-2578'));
    expect(h2h.meetings.length).toBeGreaterThan(0);
    expect(h2h.totals[0]).toHaveProperty('passAccuracy');
  });

  it('keeps only past meetings, newest first, without the match itself (PROD 18823)', () => {
    const { meetings } = m.mapHeadToHead(fx('h2h-18823'), 18823);
    expect(meetings.map((x) => x.id)).toEqual([2048, 2207]);
    expect(meetings.every((x) => x.home.score != null && x.kickoff)).toBe(true);
  });

  it('shows photos but not placeholders, and ratings only for players who played (PROD 18823)', () => {
    const lineups = m.mapLineups(fx('lineup-18823'));
    const starters = lineups.flatMap((l) => l.rows.flat());
    const subs = lineups.flatMap((l) => l.subs);
    expect(starters.some((p) => p.image?.startsWith('https://'))).toBe(true);
    expect([...starters, ...subs].every((p) => !p.image?.includes('no-photo'))).toBe(true);
    // Unused substitutes carry provider ratings (Konate 5.8); they must not show.
    expect(subs.find((p) => p.number === 8 && p.subMinute == null)?.rating).toBeNull();
    expect(subs.find((p) => p.subMinute === '46')?.rating).toBe(6.9);
    expect([...starters, ...subs].every((p) => p.rating !== 0)).toBe(true);
  });

  it('names who replaced each starter, from the bench side (PROD 18823)', () => {
    const [hazm] = m.mapLineups(fx('lineup-18823'));
    const starter = (n: number) => hazm!.rows.flat().find((p) => p.number === n);
    // The API repeats the starter's own name here; the substitute's entry has the real pair.
    expect(starter(82)).toMatchObject({ subMinute: '46', swapName: 'Mohammed Al Hamdani' });
    expect(starter(28)).toMatchObject({ subMinute: '67', swapName: 'احمد الشمراني' });
    expect(starter(17)).toMatchObject({ subMinute: null, swapName: null });
    expect(hazm!.subs.find((p) => p.number === 77)?.swapName).toBe('عبدالعزيز الحربي');
  });
});

describe('live matches', () => {
  const row = (round: unknown, matchStatus = 2) => ({ id: 1, date: '2026-10-22 16:40:00', matchStatus, status: 'جارية', matchRoundInfo: round, team1: {}, team2: {} });

  it('builds the clock from when the half started (API wall time is UTC+3)', () => {
    const match = m.mapMatch(row({ event_id: 3, time: '45', created_at: '2026-10-22 17:48:18' }));
    expect(match).toMatchObject({ state: 'live', phase: 'second_half' });
    expect(match.clock).toEqual({ startedAt: '2026-10-22T14:48:18.000Z', base: 45, cap: 90 });
  });

  it('keeps UTC+3 in winter, like the API dates (not Cairo winter time)', () => {
    const match = m.mapMatch(row({ event_id: 1, time: '0', created_at: '2026-12-01 20:00:00' }));
    expect(match.clock?.startedAt).toBe('2026-12-01T17:00:00.000Z');
  });

  it('has no clock at half-time, and postponed matches are not live', () => {
    expect(m.mapMatch(row({ event_id: 2, time: '45', created_at: '2026-10-22 17:30:23' })).clock).toBeNull();
    expect(m.mapMatch(row(null, 3))).toMatchObject({ state: 'postponed', clock: null, phase: null });
  });
});

describe('competitions', () => {
  it('maps a league with seasons and stages', () => {
    const c = m.mapCompetitionDetail(fx('tournament-3'));
    expect(c).toMatchObject({ id: 3, format: 'league', hasStandings: true });
    expect(c.currentSeason?.id).toBeTypeOf('number');
  });

  it('maps a cup with groups', () => {
    const c = m.mapCompetitionDetail(fx('tournament-28'));
    expect(c).toMatchObject({ format: 'cup', hasGroups: true, hasStandings: true });
    expect(c.seasons.length).toBeGreaterThan(1);
  });

  it('maps standings with W/D/L form only', () => {
    const s = m.mapStandings(fx('standing-3'));
    const top = s.groups[0]!.rows[0]!;
    expect(top.position).toBe(1);
    expect(top.points).toBeGreaterThan(0);
    expect(top.form.every((f) => ['W', 'D', 'L'].includes(f))).toBe(true);
  });

  it('maps named groups for group competitions (World Cup, recorded from PROD)', () => {
    const s = m.mapGroupStandings(fx('standing-groups-23'));
    expect(s.groups.length).toBeGreaterThanOrEqual(12);
    expect(s.groups[0]!.name).toBe('المجموعة أ');
    expect(s.groups[0]!.rows).toHaveLength(4);
    expect(s.groups[0]!.rows.map((r) => r.position)).toEqual([1, 2, 3, 4]);
    expect(s.groups[0]!.rows[0]!.points).toBeGreaterThan(0);
  });

  it('returns no groups for a league, so callers fall back to the flat table', () => {
    expect(m.mapGroupStandings(fx('tournament-standing-3')).groups).toEqual([]);
  });

  it('absorbs the API typos in leader boards', () => {
    const l = m.mapLeaderBoards(fx('leaders-3'));
    expect(l.topAssists[0]!.value).toBeGreaterThan(0);
    expect(l.cleanSheets[0]!.value).toBeGreaterThan(0);
    expect(l.topScorers[0]!.team?.name).toBeTruthy();
  });

  it('maps a knockout bracket ordered by slot', () => {
    const rounds = m.mapBracket(fx('bracket-28'));
    expect(rounds.length).toBeGreaterThan(0);
    const slots = rounds[0]!.matches.map((x) => x.slot);
    expect(slots).toEqual([...slots].sort((a, b) => a - b));
    expect(rounds[0]!.matches[0]!.teams).toHaveLength(2);
  });

  it('maps honours from history and last winner', () => {
    const h = m.mapHonours(fx('history-28'), fx('last-winner-24'));
    expect(h.winners[0]!.team.name).toBeTruthy();
    expect(h.lastWinner?.name).toBeTruthy();
  });
});

describe('teams and players', () => {
  it('maps a team and treats "--" as missing', () => {
    const t = m.mapTeam(fx('team-26'));
    expect(t).toMatchObject({ id: 26, shortName: 'Brighton', stadium: null, founded: null });
  });

  it('maps the squad in position order', () => {
    expect(m.mapSquad(fx('squad-26')).map((g) => g.position)).toEqual(['goalkeepers', 'defenders', 'midfielders', 'forwards']);
  });

  it('maps team stats with interval labels', () => {
    const s = m.mapTeamStats(fx('team-stats-26'));
    expect(s.byInterval.map((x) => x.label)).toEqual(['15', '30', '45', '60', '75', '90']);
  });

  it('maps a player and their stats', () => {
    expect(m.mapPlayer(fx('player-1297'))).toMatchObject({ id: 1297, shirtNumber: 9 });
    expect(m.mapPlayerStats(fx('player-stats-1297'))).toMatchObject({ goals: 21, assists: 6 });
  });

  it('maps paged transfers', () => {
    const p = m.mapTransfers(fx('transfers'));
    expect(p.page).toBe(1);
    expect(p.items[0]!.from.name).toBeTruthy();
  });
});

describe('content and games', () => {
  it('maps paged news and article tags', () => {
    const page = m.mapNewsPage(fx('media'));
    expect(page.lastPage).toBeGreaterThan(1);
    const a = m.mapArticle(fx('article-10571'));
    expect(a.bodyHtml).toContain('<p>');
    expect(a.tags.some((t) => t.kind === 'player')).toBe(true);
  });

  it('maps hubs to teams and competitions', () => {
    const hubs = m.mapHubs(fx('global-config'));
    expect(hubs.find((h) => h.key === 'al_ahly')?.kind).toBe('team');
    expect(hubs.find((h) => h.key === 'world_cup')?.kind).toBe('competition');
  });

  it('drops games of unknown type', () => {
    const games = m.mapGames(fx('games'));
    expect(games.every((g) => ['guess', 'match_predict', 'team_squad'].includes(g.type))).toBe(true);
  });

  it('maps each game type', () => {
    expect(m.mapGame(fx('game-11'))).toMatchObject({ type: 'guess', answerPath: expect.stringContaining('guess-games') });
    const predict = m.mapGame(fx('game-6'));
    expect(predict?.type).toBe('match_predict');
    if (predict?.type === 'match_predict') {
      expect(predict.outcomes).toEqual(['home', 'draw', 'away']);
      expect(predict.fixtures[0]!.kickoff).toMatch(/T\d{2}:\d{2}:\d{2}\+00:00$/);
    }
    const squad = m.mapGame(fx('game-5'));
    expect(squad).toMatchObject({ type: 'team_squad', pickCount: 11 });
  });

  it('maps search results to known kinds', () => {
    expect(m.mapSearch(fx('search')).every((r) => ['team', 'player', 'competition'].includes(r.kind))).toBe(true);
  });
});
