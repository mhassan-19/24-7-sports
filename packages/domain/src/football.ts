import type { FormResult, LiveClock, Match, MatchEvent, MatchEventKind, MatchPhase, MatchState } from './types';

/**
 * `matchStatus` from the API: 1 = not started ("لم تبدأ"), 3 = postponed ("مؤجل"),
 * 5 = finished ("انتهت"), seen on TEST and PROD. Any other value means the match is under way.
 */
export function matchStateFromStatus(status: number | null | undefined): MatchState {
  if (status === 1) return 'scheduled';
  if (status === 3) return 'postponed';
  if (status === 5) return 'finished';
  return 'live';
}

/** Live phase codes from `matchRoundInfo.event_id` (confirmed by the product owner). */
const PHASES: Record<number, MatchPhase> = {
  1: 'first_half',
  2: 'half_time',
  3: 'second_half',
  4: 'end_second_half',
  5: 'extra_time_1',
  6: 'end_extra_time_1',
  7: 'extra_time_2',
  8: 'end_extra_time_2',
  10: 'penalties',
  12: 'penalties',
};

export function phaseFromCode(code: number | null | undefined): MatchPhase | null {
  return code == null ? null : (PHASES[code] ?? null);
}

/** First minute and regular length of each half that has a running clock. */
const HALVES: Partial<Record<MatchPhase, [base: number, cap: number]>> = {
  first_half: [0, 45],
  second_half: [45, 90],
  extra_time_1: [90, 105],
  extra_time_2: [105, 120],
};

/** Clock for a half in play, from the instant it started; null at breaks and penalties. */
export function clockForPhase(phase: MatchPhase | null, startedAt: string | null): LiveClock | null {
  const half = phase ? HALVES[phase] : undefined;
  return half && startedAt ? { startedAt, base: half[0], cap: half[1] } : null;
}

/** Minute shown while live: "1" at kick-off, "67", "45+2" in added time. */
export function liveMinute(clock: LiveClock, now: number): string {
  const elapsed = Math.max(0, Math.floor((now - Date.parse(clock.startedAt)) / 60_000));
  const minute = clock.base + elapsed + 1;
  return minute > clock.cap ? `${clock.cap}+${minute - clock.cap}` : String(minute);
}

/** Event ids seen on TEST: 1–4 periods, 9 VAR, 14 yellow, 22 substitution, 24 goal. */
export function eventKindFromId(id: number, hasPlayer: boolean): MatchEventKind {
  if (id === 24) return 'goal';
  if (id === 14) return 'yellow_card';
  if (id === 15 || id === 16) return 'red_card';
  if (id === 22) return 'substitution';
  if (id === 9) return 'var';
  if (id >= 1 && id <= 4 && !hasPlayer) return 'period';
  return 'other';
}

export function isFormResult(v: unknown): v is FormResult {
  return v === 'W' || v === 'D' || v === 'L';
}

export const isLive = (m: Match) => m.state === 'live';

/**
 * Timeline order for display: the latest event on top and kick-off at the bottom, so the newest
 * is visible without scrolling. The API lists events oldest first.
 */
export const newestFirst = (events: MatchEvent[]): MatchEvent[] => [...events].reverse();

/** Live matches first, then by kickoff. Stable for equal keys. */
export function sortMatches(list: Match[]): Match[] {
  return [...list].sort((a, b) => {
    if (isLive(a) !== isLive(b)) return isLive(a) ? -1 : 1;
    return a.kickoff.localeCompare(b.kickoff);
  });
}

/** Groups matches by competition, keeping the order competitions first appear in. */
export function groupByCompetition(list: Match[]) {
  const groups = new Map<number, { competition: Match['competition']; matches: Match[] }>();
  for (const m of list) {
    const key = m.competition?.id ?? 0;
    const g = groups.get(key) ?? { competition: m.competition, matches: [] };
    g.matches.push(m);
    groups.set(key, g);
  }
  return [...groups.values()];
}

/** First letters of the Latin short name (max 3), or the first character of the name. */
export function crestInitials(name: string, shortName?: string | null): string {
  const latin = (shortName ?? '').replace(/[^A-Za-z ]/g, '').trim();
  if (latin) return latin.slice(0, 3).toUpperCase();
  return name.trim().charAt(0) || '?';
}
