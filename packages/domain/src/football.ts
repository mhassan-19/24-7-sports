import type { FormResult, Match, MatchEventKind, MatchPhase, MatchState } from './types';

/**
 * `matchStatus` from the API: 1 = not started, 5 = finished (verified on TEST data).
 * Any other value means the match is under way; the API's own label explains the detail.
 */
export function matchStateFromStatus(status: number | null | undefined): MatchState {
  if (status === 1) return 'scheduled';
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
