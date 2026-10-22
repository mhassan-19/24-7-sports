import type { SeasonQuery } from '@sports247/api';
import { useCompetition } from '@sports247/data';
import type { Id } from '@sports247/domain';

/** Competition shown in the home side rail (table + top scorers). Premier League on TEST. */
export const FEATURED_COMPETITION_ID = 3;

/**
 * Season query for a competition: the season id from the URL when given and valid, otherwise
 * the competition's current season. Null until the competition has loaded.
 */
export function useSeasonQuery(competitionId: Id, seasonParam?: string | null): SeasonQuery | null {
  const { data } = useCompetition(competitionId);
  if (!data) return null;
  const requested = seasonParam ? data.seasons.find((s) => String(s.id) === seasonParam) : undefined;
  const season = requested ?? data.currentSeason;
  return season ? { competitionId, seasonId: season.id } : null;
}
