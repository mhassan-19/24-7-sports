import { eventSide, newestFirst, substitution, topEvents, type HeadToHead, type Lineup, type LineupPlayer, type Match, type MatchEvent, type MatchStat } from '@sports247/domain';
import { useState } from 'react';
import { Link } from 'react-router';
import { usePaths, useFmt } from '../../lib/locale';
import { Slash } from '../../ui/brand';
import { Icon } from '../../ui/Icon';
import { Avatar, Crest, Eyebrow, Panel, Segmented } from '../../ui/primitives';
import { EmptyState } from '../../ui/states';
import { MatchList, Score, StatusChip, notStarted, teamName } from './MatchRow';
import s from './match.module.css';

export function MatchHeader({ match }: { match: Match }) {
  const f = useFmt();
  const paths = usePaths();
  const side = (t: Match['home']) => (
    <Link className={s.headerTeam} to={paths.team(t.id)}>
      <Crest name={t.name} shortName={t.shortName} logo={t.logo} size={56} />
      <bdi>{teamName(t, f.lang)}</bdi>
    </Link>
  );
  return (
    <header className={s.header}>
      <div className={s.centerEyebrow}>
        <Eyebrow>
          {match.competition && <bdi>{match.competition.title}</bdi>}
          {match.stage && (
            <>
              {' · '}
              <bdi>{match.stage}</bdi>
            </>
          )}
        </Eyebrow>
      </div>
      <div className={s.headerTeams}>
        {side(match.home)}
        <div className={s.mid} aria-live="polite">
          {notStarted(match) ? (
            <span className={s.kickoff} style={{ fontSize: 40 }}>
              {f.time(match.kickoff)}
            </span>
          ) : (
            <div className={s.bigScore}>
              <span className={s.n}>{f.n(match.home.score)}</span>
              <Slash height={52} width={4} />
              <span className={s.n}>{f.n(match.away.score)}</span>
            </div>
          )}
          <StatusChip match={match} />
          {match.phase && <span className="small muted">{f.t(`match.phase.${match.phase}`)}</span>}
        </div>
        {side(match.away)}
      </div>
      <div className={s.meta}>
        <span>
          {f.date(match.kickoff)} · {f.time(match.kickoff)} {f.t('common.cairoTime')}
        </span>
        {match.venue && <bdi>{match.venue}</bdi>}
      </div>
    </header>
  );
}

function EventIcon({ e }: { e: MatchEvent }) {
  switch (e.kind) {
    case 'goal':
      return <Icon name="ball" />;
    case 'substitution':
      return <Icon name="sub" />;
    case 'yellow_card':
      return <span className={s.card} aria-hidden="true" />;
    case 'red_card':
      return <span className={`${s.card} ${s.cardRed}`} aria-hidden="true" />;
    case 'var':
      return <span className={s.var}>VAR</span>;
    default:
      return <Icon name="matches" />;
  }
}

/** One event on its team's side (home at the start, away at the end), the minute between. */
function EventRow({ e, match }: { e: MatchEvent; match: Match }) {
  const f = useFmt();
  const paths = usePaths();
  const side = eventSide(e, match);
  const minute = e.minute ? `${f.digits(e.minute)}${f.t('match.minute')}` : '';
  if (e.kind === 'period' || !side) {
    return (
      <li className={s.period}>
        <bdi>{e.label}</bdi>
        {minute && <span className="num">{` · ${minute}`}</span>}
      </li>
    );
  }
  const team = side === 'home' ? match.home : match.away;
  const sub = substitution(e);
  const body = sub ? (
    // Substitution: the player coming on first, larger and in the accent colour; the one going
    // off below, smaller.
    <span className={s.eventBody}>
      <b className={s.subIn}>
        <span className="sr-only">{`${e.label} · ${f.t('match.subOn')} `}</span>
        <Link to={paths.player(sub.on.id)}>
          <bdi>{sub.on.name}</bdi>
        </Link>
      </b>
      <span className={s.subOut}>
        <span className="sr-only">{`${f.t('match.subOff')} `}</span>
        <bdi>{sub.off.name}</bdi>
        <span className="sr-only">{` · ${teamName(team, f.lang)}`}</span>
      </span>
    </span>
  ) : (
    <span className={s.eventBody}>
      <b>
        {e.player ? (
          <Link to={paths.player(e.player.id)}>
            <bdi>{e.player.name}</bdi>
          </Link>
        ) : (
          <bdi>{e.label}</bdi>
        )}
      </b>
      <span className="small muted">
        {e.player && <bdi>{e.label}</bdi>}
        {e.secondPlayer && (
          <>
            {' · '}
            <bdi>{e.secondPlayer.name}</bdi>
          </>
        )}
        <span className="sr-only">
          {' · '}
          {teamName(team, f.lang)}
        </span>
      </span>
    </span>
  );
  return (
    <li className={`${s.event} ${e.kind === 'goal' ? s.goal : ''}`}>
      <span className={s.sideHome}>
        {side === 'home' && (
          <>
            {body}
            <EventIcon e={e} />
          </>
        )}
      </span>
      <span className={s.minute}>{minute}</span>
      <span className={s.sideAway}>
        {side === 'away' && (
          <>
            <EventIcon e={e} />
            {body}
          </>
        )}
      </span>
    </li>
  );
}

type EventView = 'top' | 'all';

export function EventTimeline({ events, match }: { events: MatchEvent[]; match: Match }) {
  const f = useFmt();
  const [view, setView] = useState<EventView>('top');
  if (!events.length) return <EmptyState message={f.t('match.noEvents')} />;
  // After the final whistle: the key moments first, the full timeline one tap away.
  const finished = match.state === 'finished';
  const shown = finished && view === 'top' ? topEvents(events) : events;
  const shootout = finished && match.home.penalties != null && match.away.penalties != null;
  return (
    <>
      {finished && (
        <Segmented<EventView>
          label={f.t('match.tabs.events')}
          value={view}
          onChange={setView}
          options={[
            { value: 'top', label: f.t('match.topEvents') },
            { value: 'all', label: f.t('match.allEvents') },
          ]}
        />
      )}
      {shown.length || shootout ? (
        <ol className={s.events} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {shootout && (
            <li className={s.period}>
              {f.t('match.shootout')}
              <span className="num">{` · ${f.n(match.home.penalties)} – ${f.n(match.away.penalties)}`}</span>
            </li>
          )}
          {newestFirst(shown).map((e, i) => (
            <EventRow key={i} e={e} match={match} />
          ))}
        </ol>
      ) : (
        <EmptyState message={f.t('match.noTopEvents')} />
      )}
    </>
  );
}

export function StatCompare({ label, home, away, suffix = '' }: { label: string; home: number; away: number; suffix?: string }) {
  const f = useFmt();
  const total = home + away || 1;
  return (
    <div className={s.compare}>
      <span className={s.compareValue}>
        {f.n(home)}
        {suffix}
      </span>
      <span className={s.compareLabel}>{label}</span>
      <span className={s.compareValue}>
        {f.n(away)}
        {suffix}
      </span>
      <div className={s.bars} aria-hidden="true">
        <i className={s.barHome} style={{ flex: home / total }} />
        <i className={s.barAway} style={{ flex: away / total }} />
      </div>
    </div>
  );
}

export function MatchStats({ stats, match }: { stats: MatchStat[]; match: Match }) {
  const f = useFmt();
  if (!stats.length) return <EmptyState message={f.t('match.noStats')} />;
  return (
    <Panel>
      <div className={s.headerTeams} style={{ fontWeight: 700 }}>
        <bdi>{teamName(match.home, f.lang)}</bdi>
        <span />
        <bdi style={{ textAlign: 'end' }}>{teamName(match.away, f.lang)}</bdi>
      </div>
      {stats.map((st) => (
        <StatCompare
          key={st.key}
          label={f.t(`match.stats.${st.key}`)}
          home={st.home}
          away={st.away}
          suffix={st.key === 'possession' ? '%' : ''}
        />
      ))}
    </Panel>
  );
}

function PitchPlayer({ p, best }: { p: LineupPlayer; best: number }) {
  const f = useFmt();
  const paths = usePaths();
  const [failed, setFailed] = useState(false);
  const photo = p.image && !failed ? p.image : null;
  const last = p.name.trim().split(/\s+/).slice(-1)[0] ?? p.name;
  return (
    <Link className={s.player} to={paths.player(p.id)} aria-label={p.name}>
      <span className={`${s.disc} ${photo ? s.discPhoto : ''}`}>
        {photo ? <img src={photo} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} /> : f.n(p.number)}
        {photo && p.number != null && (
          <span className={s.discNumber} aria-hidden="true">
            {f.n(p.number)}
          </span>
        )}
        {(p.goals > 0 || p.yellowCard || p.redCard) && (
          <span className={s.discEvents} aria-hidden="true">
            {p.goals > 0 && <Icon name="ball" />}
            {p.yellowCard && <span className={s.card} />}
            {p.redCard && <span className={`${s.card} ${s.cardRed}`} />}
          </span>
        )}
      </span>
      <bdi className={s.playerName} dir="auto">
        {last}
      </bdi>
      {(p.subMinute || p.rating != null) && (
        <span className={s.playerMeta}>
          {p.subMinute && (
            <span className={s.subMark} title={`${f.t('match.subOff')} ${f.digits(p.subMinute)}${f.t('match.minute')}`}>
              <Icon name="sub" />
              {f.digits(p.subMinute)}&apos;
            </span>
          )}
          {p.rating != null && <span className={`${s.rating} ${p.rating === best ? s.ratingTop : ''}`}>{f.n(p.rating)}</span>}
        </span>
      )}
    </Link>
  );
}

export function Lineups({ lineups }: { lineups: Lineup[] }) {
  const f = useFmt();
  const paths = usePaths();
  const [index, setIndex] = useState(0);
  const withPlayers = lineups.filter((l) => l.hasLineup && l.rows.length);
  if (!withPlayers.length) return <EmptyState message={f.t('match.noLineup')} />;
  const l = withPlayers[Math.min(index, withPlayers.length - 1)]!;
  const best = Math.max(0, ...withPlayers.flatMap((x) => x.rows.flat().map((p) => p.rating ?? 0)));
  return (
    <>
      {withPlayers.length > 1 && (
        <Segmented
          label={f.t('match.tabs.lineups')}
          value={index}
          onChange={setIndex}
          options={withPlayers.map((x, i) => ({ value: i, label: <bdi>{x.teamName}</bdi> }))}
        />
      )}
      {l.formation && (
        <p className="small muted">
          {f.t('match.formation')}:{' '}
          <span className="num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
            {f.digits(l.formation)}
          </span>
        </p>
      )}
      <div className={s.lineupGrid}>
        <div className={s.pitch} role="group" aria-label={`${l.teamName} ${l.formation ?? ''}`}>
          <span className={`${s.box} ${s.boxTop}`} />
          <span className={`${s.box} ${s.boxBottom}`} />
          {l.rows.map((row, i) => (
            <div key={i} className={s.pitchRow}>
              {row.map((p) => (
                <PitchPlayer key={p.id} p={p} best={best} />
              ))}
            </div>
          ))}
        </div>
        <Panel>
          <b>{f.t('match.subs')}</b>
          <div>
            {l.subs.map((p) => (
              <div key={p.id} className={s.sub}>
                <span className="num" style={{ fontWeight: 700 }}>
                  {f.n(p.number)}
                </span>
                <Link to={paths.player(p.id)} className={s.subName}>
                  <Avatar name={p.name} image={p.image} size={28} />
                  <span className={s.subWho}>
                    <bdi>{p.name}</bdi>
                    {p.subMinute && p.swapName && (
                      <span className={s.subFor}>{f.t('match.subFor', { name: p.swapName })}</span>
                    )}
                  </span>
                </Link>
                <span className={`small muted ${s.subName}`}>
                  {p.subMinute && (
                    <>
                      <span className={s.subMark} aria-hidden="true">
                        <Icon name="sub" />
                      </span>
                      {`${f.t('match.subOn')} ${f.digits(p.subMinute)}${f.t('match.minute')}`}
                    </>
                  )}
                </span>
                {p.rating != null ? <span className={s.rating}>{f.n(p.rating)}</span> : <span />}
              </div>
            ))}
          </div>
          {l.manager && (
            <p className="small muted">
              {f.t('match.manager')}: <bdi>{l.manager}</bdi>
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}

export function HeadToHeadView({ data }: { data: HeadToHead }) {
  const f = useFmt();
  if (!data.meetings.length) return <EmptyState message={f.t('match.noMeetings')} />;
  const [a, b] = data.totals;
  const meetings: Match[] = data.meetings.map((m) => ({
    id: m.id,
    sportId: 1,
    kickoff: m.kickoff,
    state: 'finished',
    statusLabel: '',
    phase: null,
    clock: null,
    home: m.home,
    away: m.away,
    competition: m.competition,
    stage: null,
    venue: m.venue,
    regionIds: [],
  }));
  return (
    <>
      <MatchList matches={meetings} meta={(m) => f.date(m.kickoff)} />
      {a && b && (
        <Panel>
          <b>{f.t('match.totals')}</b>
          <StatCompare label={f.t('match.stats.shotsOnTarget')} home={a.shotsOnTarget} away={b.shotsOnTarget} />
          <StatCompare label={f.t('match.stats.passes')} home={a.passes} away={b.passes} />
          <StatCompare label={f.t('match.stats.yellowCards')} home={a.yellowCards} away={b.yellowCards} />
          <StatCompare label={f.t('match.stats.passAccuracy')} home={a.passAccuracy} away={b.passAccuracy} suffix="%" />
          <p className="small muted">
            <bdi>{a.teamName}</bdi> / <bdi>{b.teamName}</bdi>
          </p>
        </Panel>
      )}
    </>
  );
}

export { Score };
