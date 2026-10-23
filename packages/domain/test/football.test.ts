import { describe, expect, it } from 'vitest';
import type { Match } from '../src';
import {
  clockForPhase,
  crestInitials,
  eventSide,
  eventKindFromId,
  groupByCompetition,
  liveMinute,
  matchStateFromStatus,
  newestFirst,
  substitution,
  topEvents,
  phaseFromCode,
  sortMatches,
} from '../src';

const m = (id: number, state: Match['state'], kickoff: string, comp = 3): Match => ({
  id,
  sportId: 1,
  kickoff,
  state,
  statusLabel: '',
  phase: null,
  clock: null,
  home: { id: 1, name: 'A', shortName: null, logo: null, score: null, penalties: null },
  away: { id: 2, name: 'B', shortName: null, logo: null, score: null, penalties: null },
  competition: { id: comp, title: `C${comp}`, logo: null },
  stage: null,
  venue: null,
  regionIds: [],
});

describe('match status and phase', () => {
  it('maps 1 to scheduled, 3 to postponed, 5 to finished, anything else to live', () => {
    expect(matchStateFromStatus(1)).toBe('scheduled');
    expect(matchStateFromStatus(3)).toBe('postponed');
    expect(matchStateFromStatus(5)).toBe('finished');
    expect(matchStateFromStatus(2)).toBe('live');
  });

  it('maps confirmed phase codes, including both penalty codes', () => {
    expect(phaseFromCode(2)).toBe('half_time');
    expect(phaseFromCode(7)).toBe('extra_time_2');
    expect(phaseFromCode(10)).toBe('penalties');
    expect(phaseFromCode(12)).toBe('penalties');
    expect(phaseFromCode(9)).toBeNull();
    expect(phaseFromCode(null)).toBeNull();
  });
});

describe('live clock', () => {
  // Second half of PROD match 18823 started 2026-10-22 17:48:18 Cairo (14:48:18 UTC); a
  // substitution logged 44 s later is minute 46 in the API's own events.
  const second = clockForPhase('second_half', '2026-10-22T14:48:18.000Z')!;
  const at = (iso: string) => Date.parse(iso);

  it('counts from the start of the half, football style', () => {
    expect(liveMinute(second, at('2026-10-22T14:49:02Z'))).toBe('46');
    expect(liveMinute(second, at('2026-10-22T15:12:43Z'))).toBe('70');
  });

  it('shows added time past the end of the half', () => {
    expect(liveMinute(second, at('2026-10-22T15:35:30Z'))).toBe('90+3');
    const first = clockForPhase('first_half', '2026-10-22T13:40:00Z')!;
    expect(liveMinute(first, at('2026-10-22T14:26:10Z'))).toBe('45+2');
  });

  it('never goes below the first minute of the half (clock skew)', () => {
    expect(liveMinute(second, at('2026-10-22T14:40:00Z'))).toBe('46');
  });

  it('has no clock at breaks, penalties or without a start time', () => {
    expect(clockForPhase('half_time', '2026-10-22T14:48:18Z')).toBeNull();
    expect(clockForPhase('penalties', '2026-10-22T14:48:18Z')).toBeNull();
    expect(clockForPhase('first_half', null)).toBeNull();
  });
});

describe('event sides and top events', () => {
  const ev = (kind: 'goal' | 'red_card' | 'yellow_card' | 'substitution' | 'period', teamId: number | null) => ({
    kind,
    label: kind,
    minute: '10',
    teamId,
    player: null,
    secondPlayer: null,
  });
  const teams = { home: m(1, 'finished', 'x').home, away: m(1, 'finished', 'x').away };

  it('puts each event on its team side, period markers on neither', () => {
    expect(eventSide(ev('goal', 1), teams)).toBe('home');
    expect(eventSide(ev('goal', 2), teams)).toBe('away');
    expect(eventSide(ev('period', null), teams)).toBeNull();
    expect(eventSide(ev('goal', 99), teams)).toBeNull();
  });

  it('keeps only goals and red cards as top events', () => {
    const all = [ev('period', null), ev('goal', 1), ev('yellow_card', 2), ev('substitution', 1), ev('red_card', 2)];
    expect(topEvents(all).map((e) => e.kind)).toEqual(['goal', 'red_card']);
  });

  it('reads a substitution as off (first player) and on (second player)', () => {
    const e = { ...ev('substitution', 1), player: { id: 4478, name: 'احمد باماسود' }, secondPlayer: { id: 32227, name: 'تركي الجعدي' } };
    expect(substitution(e)).toEqual({ off: { id: 4478, name: 'احمد باماسود' }, on: { id: 32227, name: 'تركي الجعدي' } });
    expect(substitution(ev('goal', 1))).toBeNull();
  });

  it('counts a second yellow (id 15) as a red card', () => {
    expect(eventKindFromId(15, true)).toBe('red_card');
    expect(eventKindFromId(16, true)).toBe('red_card');
  });
});

describe('events', () => {
  it('shows the latest event first and kick-off last', () => {
    const ev = (label: string, minute: string | null) => ({ kind: 'other' as const, label, minute, teamId: null, player: null, secondPlayer: null });
    const api = [ev('kick-off', null), ev('goal', '5'), ev('half-time', null), ev('card', '59')];
    expect(newestFirst(api).map((e) => e.label)).toEqual(['card', 'half-time', 'goal', 'kick-off']);
    expect(api[0]!.label).toBe('kick-off');
  });

  it('treats ids 1–4 without a player as period markers', () => {
    expect(eventKindFromId(1, false)).toBe('period');
    expect(eventKindFromId(4, true)).toBe('other');
    expect(eventKindFromId(24, true)).toBe('goal');
    expect(eventKindFromId(22, true)).toBe('substitution');
  });
});

describe('ordering and grouping', () => {
  it('puts live matches first, then sorts by kickoff', () => {
    const out = sortMatches([
      m(1, 'finished', '2026-01-19T20:00'),
      m(2, 'live', '2026-01-19T22:00'),
      m(3, 'scheduled', '2026-01-19T18:00'),
    ]);
    expect(out.map((x) => x.id)).toEqual([2, 3, 1]);
  });

  it('groups by competition in first-seen order', () => {
    const g = groupByCompetition([m(1, 'live', 'a', 3), m(2, 'live', 'b', 7), m(3, 'live', 'c', 3)]);
    expect(g.map((x) => x.competition?.id)).toEqual([3, 7]);
    expect(g[0]!.matches.map((x) => x.id)).toEqual([1, 3]);
  });
});

describe('crest initials', () => {
  it('prefers the Latin short name, falls back to the first letter', () => {
    expect(crestInitials('برايتون', 'Brighton')).toBe('BRI');
    expect(crestInitials('الأهلي', null)).toBe('ا');
  });
});
