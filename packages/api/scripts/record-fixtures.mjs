// Records GET responses into test/fixtures/ for unit tests. GET only. TEST by default; a few
// shapes that only exist in production data are read from PROD (still GET only).
// Long arrays are trimmed to keep the repo small.
// Usage: pnpm record-fixtures [name ...]   (no names = record everything)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://testv3.appkora.com/api/';
const PROD = 'https://v3.appkora.com/api/';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'test', 'fixtures');
const MAX_ITEMS = 25;

const FIXTURES = {
  'global-config': 'global-config',
  services: 'services',
  'active-tournaments': 'activeTournaments',
  'home-calendar': 'homeCalendar',
  'tournament-3': 'tournaments/3',
  'tournament-28': 'tournaments/28',
  'standing-3': 'teamsStanding?tournament_id=3&season_id=2',
  'standing-28': 'teamsStanding?tournament_id=28&season_id=16',
  'tournament-matches-3': 'tournament/matches?tournament_id=3&season_id=2',
  'tournament-calendar-3': 'tournamentCalendar?tournament_id=3&season_id=2',
  'leaders-3': 'topLeaguePlayers?tournament_id=3&season_id=2&items_count=5',
  'top-scorers-3': 'top-scorers?tournament_id=3&season_id=2',
  'top-assists-3': 'top-assists?tournament_id=3&season_id=2',
  'tournament-teams-3': 'tournament-teams?tournament_id=3&season_id=2',
  'bracket-28': 'knockout-stage-bracket?tournament_id=28&season_id=16',
  'progress-28': 'tournament-progress?tournament_id=28&season_id=16',
  'history-28': 'tournament-history/28',
  'last-winner-24': 'tournament-most-last-winner?tournament_id=24',
  'team-of-week-28': 'team-of-the-week?tournament_id=28',
  'match-stats-2578': 'matchStatistics?match_id=2578',
  'match-events-2578': 'match_events?match_id=2578',
  'lineup-2578': 'newLineup/2578',
  'h2h-2578': 'newLatest-matches-for-teams?match_id=2578',
  'match-media-2578': 'matchMedia?match_id=2578',
  'team-26': 'teams/26',
  'team-calendar-26': 'teamCalendar?team_id=26',
  'squad-26': 'teams/26/squad',
  'team-stats-26': 'teamStatistics?team_id=26&tournament_id=3&season_id=2',
  'galleries-1': 'al-ahly/galleryList/1',
  'gallery-92': 'teamGallery/92',
  'player-1297': 'players/1297/details',
  'player-stats-1297': 'players/1297/statistics?tournament_id=3&season_id=2',
  'career-1297': 'player-history-details/1297',
  transfers: 'transferes',
  media: 'media',
  'mix-media': 'mixMedia',
  'article-10571': 'media/10571',
  search: `full-search?keyword=${encodeURIComponent('صلاح')}`,
  games: 'games',
  'game-11': 'games/11',
  'game-6': 'games/6',
  'game-5': 'games/5',
  'tournament-standing-3': 'tournament/standing?tournament_id=3&season_id=2',
  // Group tables (World Cup 2026): TEST has no group data.
  'standing-groups-23': { base: PROD, path: 'tournament/standing?tournament_id=23&season_id=36' },
};

const trim = (v) => {
  if (Array.isArray(v)) return v.slice(0, MAX_ITEMS).map(trim);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, trim(x)]));
  return v;
};

mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
for (const [name, spec] of Object.entries(FIXTURES)) {
  if (only.length && !only.includes(name)) continue;
  const { base, path } = typeof spec === 'string' ? { base: BASE, path: spec } : spec;
  const res = await fetch(base + path, { headers: { Accept: 'application/json' } });
  const body = await res.json();
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(trim(body), null, 1) + '\n');
  console.log(`${res.status} ${name}`);
}
