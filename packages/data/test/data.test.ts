import { ApiError } from '@sports247/api';
import { describe, expect, it } from 'vitest';
import type { Match, MatchDetail } from '@sports247/domain';
import { keys, shouldRetry, withDayClock } from '../src';

describe('shouldRetry', () => {
  it('does not retry client errors or blocked writes', () => {
    expect(shouldRetry(0, new ApiError('http', 'x', { status: 404 }))).toBe(false);
    expect(shouldRetry(0, new ApiError('validation', 'x', { status: 422 }))).toBe(false);
    expect(shouldRetry(0, new ApiError('blocked', 'x'))).toBe(false);
  });

  it('retries network errors and 5xx twice', () => {
    expect(shouldRetry(0, new ApiError('network', 'x'))).toBe(true);
    expect(shouldRetry(1, new ApiError('http', 'x', { status: 503 }))).toBe(true);
    expect(shouldRetry(2, new ApiError('network', 'x'))).toBe(false);
  });
});

describe('query keys', () => {
  it('nests match parts under the match so one invalidation refreshes all', () => {
    expect(keys.events(5).slice(0, 2)).toEqual(keys.match(5));
  });
});

describe('live clock on the match page', () => {
  const match = (over: Partial<Match>): Match => ({
    id: 7,
    sportId: 1,
    kickoff: '2026-10-22T16:40',
    state: 'live',
    statusLabel: '',
    phase: null,
    clock: null,
    home: { id: 1, name: 'A', shortName: null, logo: null, score: 1, penalties: null },
    away: { id: 2, name: 'B', shortName: null, logo: null, score: 0, penalties: null },
    competition: null,
    stage: null,
    venue: null,
    regionIds: [],
    ...over,
  });
  const clock = { startedAt: '2026-10-22T14:48:18.000Z', base: 45, cap: 90 };
  const days = { yesterday: [], today: [match({ phase: 'second_half', clock })], tomorrow: [] };

  it('takes phase and clock from the day list while live', () => {
    const detail: MatchDetail = { match: match({}), stats: [] };
    expect(withDayClock(detail, days)?.match).toMatchObject({ phase: 'second_half', clock, home: { score: 1 } });
  });

  it('leaves finished matches and unknown matches alone', () => {
    const finished: MatchDetail = { match: match({ state: 'finished' }), stats: [] };
    expect(withDayClock(finished, days)).toBe(finished);
    const other: MatchDetail = { match: match({ id: 99 }), stats: [] };
    expect(withDayClock(other, days)).toBe(other);
  });
});
