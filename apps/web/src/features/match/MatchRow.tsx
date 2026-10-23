import { useLiveMinute } from '@sports247/data';
import { groupByCompetition, type Match, type MatchSide } from '@sports247/domain';
import { Link } from 'react-router';
import { usePaths, useFmt, type Fmt } from '../../lib/locale';
import { Crest } from '../../ui/primitives';
import s from './match.module.css';

/** Team name for display: English mode uses the Latin short name when the API has one. */
export const teamName = (t: Pick<MatchSide, 'name' | 'shortName'>, lang: string) =>
  lang === 'en' && t.shortName ? t.shortName : t.name;

/** Status under the score. `meta` replaces it (e.g. the date of a past meeting). */
export function StatusChip({ match, meta }: { match: Match; meta?: string }) {
  const f = useFmt();
  const minute = useLiveMinute(match);
  if (meta) return <span className={s.status}>{meta}</span>;
  if (match.state === 'finished') return <span className={s.status}>{f.t('match.finished')}</span>;
  if (match.state === 'postponed') return <span className={s.status}>{f.t('match.postponed')}</span>;
  if (match.state === 'scheduled') return <span className={s.status}>{f.day(match.kickoff)}</span>;
  return (
    <span className={`${s.status} ${s.live}`}>
      <i className={s.dot} aria-hidden="true" />
      {f.t('match.live')}
      {minute && (
        <span className="num">
          {f.digits(minute)}
          {f.t('match.minute')}
        </span>
      )}
    </span>
  );
}

/** Not played yet: show the kickoff time instead of a score. */
export const notStarted = (m: Match) => m.state === 'scheduled' || m.state === 'postponed';

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
  if (m.state === 'postponed') return `${f.t('match.fixtureLabel', { home, away, time: f.dateTime(m.kickoff) })} · ${f.t('match.postponed')}`;
  const status = m.state === 'live' ? f.t('match.live') : f.t('match.finished');
  return `${f.t('match.scoreLabel', { home, away, homeScore: f.n(m.home.score), awayScore: f.n(m.away.score) })} · ${status}`;
}

export function MatchRow({ match, meta }: { match: Match; meta?: string }) {
  const f = useFmt();
  const paths = usePaths();
  return (
    <Link className={s.row} to={paths.match(match.id)} aria-label={matchLabel(match, f)}>
      <span className={s.team}>
        <Crest name={match.home.name} shortName={match.home.shortName} logo={match.home.logo} />
        <bdi>{teamName(match.home, f.lang)}</bdi>
      </span>
      <span className={s.mid}>
        {notStarted(match) ? (
          <span className={s.kickoff}>{f.time(match.kickoff)}</span>
        ) : (
          <Score home={match.home.score} away={match.away.score} f={f} />
        )}
        <StatusChip match={match} meta={meta} />
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

export function MatchList({ matches, meta }: { matches: Match[]; meta?: (m: Match) => string }) {
  return (
    <div className={s.group}>
      {matches.map((m) => (
        <MatchRow key={m.id} match={m} meta={meta?.(m)} />
      ))}
    </div>
  );
}
