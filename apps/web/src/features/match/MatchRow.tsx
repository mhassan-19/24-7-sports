import { groupByCompetition, type Match, type MatchSide } from '@sports247/domain';
import { Link } from 'react-router';
import { usePaths, useFmt, type Fmt } from '../../lib/locale';
import { Crest } from '../../ui/primitives';
import s from './match.module.css';

/** Team name for display: English mode uses the Latin short name when the API has one. */
export const teamName = (t: Pick<MatchSide, 'name' | 'shortName'>, lang: string) =>
  lang === 'en' && t.shortName ? t.shortName : t.name;

export function StatusChip({ match }: { match: Match }) {
  const f = useFmt();
  if (match.state === 'finished') return <span className={s.status}>{f.t('match.finished')}</span>;
  if (match.state === 'scheduled') return <span className={s.status}>{f.day(match.kickoff)}</span>;
  return (
    <span className={`${s.status} ${s.live}`}>
      <i className={s.dot} aria-hidden="true" />
      {f.t('match.live')}
      {match.minute && (
        <span className="num">
          {f.digits(match.minute)}
          {f.t('match.minute')}
        </span>
      )}
    </span>
  );
}

export function Score({ home, away, f }: { home: number | null; away: number | null; f: Fmt }) {
  // Three flex items, so each number stays next to its team in both directions.
  return (
    <span className={s.score}>
      <span>{f.n(home)}</span>
      <span aria-hidden="true">–</span>
      <span>{f.n(away)}</span>
    </span>
  );
}

export function matchLabel(m: Match, f: Fmt): string {
  const home = teamName(m.home, f.lang);
  const away = teamName(m.away, f.lang);
  if (m.state === 'scheduled') return f.t('match.fixtureLabel', { home, away, time: f.dateTime(m.kickoff) });
  const status = m.state === 'live' ? f.t('match.live') : f.t('match.finished');
  return `${f.t('match.scoreLabel', { home, away, homeScore: f.n(m.home.score), awayScore: f.n(m.away.score) })} · ${status}`;
}

export function MatchRow({ match }: { match: Match }) {
  const f = useFmt();
  const paths = usePaths();
  return (
    <Link className={s.row} to={paths.match(match.id)} aria-label={matchLabel(match, f)}>
      <span className={s.team}>
        <Crest name={match.home.name} shortName={match.home.shortName} logo={match.home.logo} />
        <bdi>{teamName(match.home, f.lang)}</bdi>
      </span>
      <span className={s.mid}>
        {match.state === 'scheduled' ? (
          <span className={s.kickoff}>{f.time(match.kickoff)}</span>
        ) : (
          <Score home={match.home.score} away={match.away.score} f={f} />
        )}
        <StatusChip match={match} />
      </span>
      <span className={`${s.team} ${s.away}`}>
        <bdi>{teamName(match.away, f.lang)}</bdi>
        <Crest name={match.away.name} shortName={match.away.shortName} logo={match.away.logo} />
      </span>
    </Link>
  );
}

/** Matches grouped under their competition, live first within each group. */
export function MatchGroups({ matches }: { matches: Match[] }) {
  const paths = usePaths();
  return (
    <>
      {groupByCompetition(matches).map((g) => (
        <div key={g.competition?.id ?? 0} className={s.group}>
          {g.competition ? (
            <Link className={s.groupHead} to={paths.competition(g.competition.id)}>
              <Crest name={g.competition.title} logo={g.competition.logo} size={22} />
              <bdi>{g.competition.title}</bdi>
            </Link>
          ) : null}
          {g.matches.map((m) => (
            <MatchRow key={m.id} match={m} />
          ))}
        </div>
      ))}
    </>
  );
}

export function MatchList({ matches }: { matches: Match[] }) {
  return (
    <div className={s.group}>
      {matches.map((m) => (
        <MatchRow key={m.id} match={m} />
      ))}
    </div>
  );
}
