import { useLiveMinute } from '@sports247/data';
import { eventSide, groupByCompetition, newestFirst, substitution, topEvents, type HeadToHead, type Lineup, type LineupPlayer, type Match, type MatchEvent, type MatchSide, type MatchStat } from '@sports247/domain';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { paths, useFmt, type Fmt } from '../lib/locale';
import { useTheme } from '../lib/theme';
import { Slash } from '../ui/brand';
import { Icon } from '../ui/Icon';
import { Avatar, Card, Crest, Eyebrow, Segmented } from '../ui/primitives';
import { EmptyState } from '../ui/states';
import { Text } from '../ui/Text';

/** English mode uses the Latin short name when the API has one. */
export const teamName = (t: Pick<MatchSide, 'name' | 'shortName'>, lang: string) =>
  lang === 'en' && t.shortName ? t.shortName : t.name;

/** Status under the score. `meta` replaces it (e.g. the date of a past meeting). */
export function StatusChip({ match, meta }: { match: Match; meta?: string }) {
  const f = useFmt();
  const { c } = useTheme();
  const minute = useLiveMinute(match);
  if (meta) return <Text variant="caption" color="text2">{meta}</Text>;
  if (match.state === 'finished') return <Text variant="caption" color="text2">{f.t('match.finished')}</Text>;
  if (match.state === 'postponed') return <Text variant="caption" color="text2">{f.t('match.postponed')}</Text>;
  if (match.state === 'scheduled') return <Text variant="caption" color="text2">{f.day(match.kickoff)}</Text>;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent }} />
      <Text variant="caption" color="accentText">
        {f.t('match.live')}
        {minute ? ` ${f.digits(minute)}${f.t('match.minute')}` : ''}
      </Text>
    </View>
  );
}

/** Not played yet: show the kickoff time instead of a score. */
const notStarted = (m: Match) => m.state === 'scheduled' || m.state === 'postponed';

function matchLabel(m: Match, f: Fmt) {
  const home = teamName(m.home, f.lang);
  const away = teamName(m.away, f.lang);
  if (m.state === 'scheduled') return f.t('match.fixtureLabel', { home, away, time: f.dateTime(m.kickoff) });
  if (m.state === 'postponed') return `${f.t('match.fixtureLabel', { home, away, time: f.dateTime(m.kickoff) })} · ${f.t('match.postponed')}`;
  return `${f.t('match.scoreLabel', { home, away, homeScore: f.n(m.home.score), awayScore: f.n(m.away.score) })} · ${m.state === 'live' ? f.t('match.live') : f.t('match.finished')}`;
}

export function MatchRow({ match, last, meta }: { match: Match; last?: boolean; meta?: string }) {
  const f = useFmt();
  const { c } = useTheme();
  const team = (t: MatchSide, end?: boolean) => (
    <View style={{ flex: 1, flexDirection: end ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <Crest name={t.name} shortName={t.shortName} logo={t.logo} />
      <Text variant="title" numberOfLines={2} style={{ flexShrink: 1, textAlign: end ? 'right' : 'left' }}>
        {teamName(t, f.lang)}
      </Text>
    </View>
  );
  return (
    <Pressable
      onPress={() => router.push(paths.match(match.id))}
      accessibilityRole="button"
      accessibilityLabel={matchLabel(match, f)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        minHeight: 64,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.line,
        backgroundColor: pressed ? c.surface2 : 'transparent',
      })}
    >
      {team(match.home)}
      <View style={{ alignItems: 'center', minWidth: 64, gap: 2 }}>
        {notStarted(match) ? (
          <Text variant="num" size={19}>{f.time(match.kickoff)}</Text>
        ) : (
          <Score home={match.home.score} away={match.away.score} />
        )}
        <StatusChip match={match} meta={meta} />
      </View>
      {team(match.away, true)}
    </Pressable>
  );
}

/** Three items in a row, so each number stays next to its team in both directions. */
export function Score({ home, away }: { home: number | null; away: number | null }) {
  const f = useFmt();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      <Text variant="score">{f.n(home)}</Text>
      <Text variant="score">–</Text>
      <Text variant="score">{f.n(away)}</Text>
    </View>
  );
}

export function MatchGroups({ matches }: { matches: Match[] }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 14 }}>
      {groupByCompetition(matches).map((g) => (
        <Card key={g.competition?.id ?? 0}>
          {g.competition ? (
            <Pressable
              onPress={() => router.push(paths.competition(g.competition!.id))}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line }}
            >
              <Crest name={g.competition.title} logo={g.competition.logo} size={22} />
              <Text variant="label" numberOfLines={1} style={{ flex: 1 }}>
                {g.competition.title}
              </Text>
            </Pressable>
          ) : null}
          {g.matches.map((m, i) => (
            <MatchRow key={m.id} match={m} last={i === g.matches.length - 1} />
          ))}
        </Card>
      ))}
    </View>
  );
}

export function MatchList({ matches, meta }: { matches: Match[]; meta?: (m: Match) => string }) {
  return (
    <Card>
      {matches.map((m, i) => (
        <MatchRow key={m.id} match={m} last={i === matches.length - 1} meta={meta?.(m)} />
      ))}
    </Card>
  );
}

export function MatchHeader({ match }: { match: Match }) {
  const f = useFmt();
  const side = (t: MatchSide) => (
    <Pressable onPress={() => router.push(paths.team(t.id))} accessibilityRole="button" style={{ flex: 1, alignItems: 'center', gap: 8 }}>
      <Crest name={t.name} shortName={t.shortName} logo={t.logo} size={56} />
      <Text variant="title" align="center" numberOfLines={2}>
        {teamName(t, f.lang)}
      </Text>
    </Pressable>
  );
  return (
    <Card style={{ padding: 16, gap: 14 }}>
      <View style={{ alignItems: 'center' }}>
        <Eyebrow>{[match.competition?.title, match.stage].filter(Boolean).join(' · ')}</Eyebrow>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessibilityLiveRegion="polite">
        {side(match.home)}
        <View style={{ alignItems: 'center', gap: 4 }}>
          {notStarted(match) ? (
            <Text variant="num" size={36}>{f.time(match.kickoff)}</Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text variant="scoreLg">{f.n(match.home.score)}</Text>
              <Slash height={48} width={4} />
              <Text variant="scoreLg">{f.n(match.away.score)}</Text>
            </View>
          )}
          <StatusChip match={match} />
          {match.phase ? <Text variant="caption" color="text2">{f.t(`match.phase.${match.phase}`)}</Text> : null}
        </View>
        {side(match.away)}
      </View>
      <Text variant="caption" color="text2" align="center">
        {`${f.date(match.kickoff)} · ${f.time(match.kickoff)} ${f.t('common.cairoTime')}${match.venue ? ` · ${match.venue}` : ''}`}
      </Text>
    </Card>
  );
}

function CardIcon({ red, small }: { red?: boolean; small?: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        width: small ? 8 : 12,
        height: small ? 11 : 16,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: c.cardEdge,
        backgroundColor: red ? c.cardRed : c.cardYellow,
      }}
    />
  );
}

function EventIcon({ e }: { e: MatchEvent }) {
  const { c } = useTheme();
  if (e.kind === 'goal') return <Icon name="ball" />;
  if (e.kind === 'substitution') return <Icon name="sub" />;
  if (e.kind === 'yellow_card') return <CardIcon />;
  if (e.kind === 'red_card') return <CardIcon red />;
  if (e.kind === 'var')
    return (
      <View style={{ borderWidth: 1.5, borderColor: c.text2, borderRadius: 4, paddingHorizontal: 2 }}>
        <Text variant="num" size={10} weight={800} color="text2">VAR</Text>
      </View>
    );
  return <Icon name="matches" />;
}

/** One event on its team's side (home at the start, away at the end), the minute between. */
function EventRow({ e, match, last }: { e: MatchEvent; match: Match; last: boolean }) {
  const f = useFmt();
  const { c } = useTheme();
  const side = eventSide(e, match);
  const border = { borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line };
  const minute = e.minute ? `${f.digits(e.minute)}${f.t('match.minute')}` : '';
  if (e.kind === 'period' || !side) {
    return (
      <View style={[{ paddingVertical: 8, alignItems: 'center', backgroundColor: c.bg }, border]}>
        <Text variant="caption" color="text2">
          {e.label}
          {minute ? ` · ${minute}` : ''}
        </Text>
      </View>
    );
  }
  const home = side === 'home';
  const team = home ? match.home : match.away;
  // `right`/`flex-end` flip in RTL, so the home column always lines up toward the minute.
  const align = home ? 'right' : 'left';
  const sub = substitution(e);
  const detail = [e.player ? e.label : null, e.secondPlayer?.name].filter(Boolean).join(' · ');
  // Substitution: the player coming on first, larger and in the accent colour; the one going off
  // below, smaller.
  const body = sub ? (
    <View style={{ flexShrink: 1, alignItems: home ? 'flex-end' : 'flex-start' }}>
      <Text variant="label" size={15} color="accentText" numberOfLines={2} align={align}>{sub.on.name}</Text>
      <Text variant="caption" color="text2" numberOfLines={2} align={align}>{sub.off.name}</Text>
    </View>
  ) : (
    <View style={{ flexShrink: 1, alignItems: home ? 'flex-end' : 'flex-start' }}>
      <Text variant="label" numberOfLines={2} align={align}>{e.player?.name ?? e.label}</Text>
      {detail ? <Text variant="caption" color="text2" numberOfLines={2} align={align}>{detail}</Text> : null}
    </View>
  );
  const linked = sub ? sub.on : e.player;
  const icon = (
    <View style={{ width: 24, alignItems: 'center' }}>
      <EventIcon e={e} />
    </View>
  );
  return (
    <Pressable
      disabled={!linked}
      onPress={() => linked && router.push(paths.player(linked.id))}
      accessibilityLabel={(sub
        ? [minute, e.label, `${f.t('match.subOn')} ${sub.on.name}`, `${f.t('match.subOff')} ${sub.off.name}`, teamName(team, f.lang)]
        : [minute, e.label, e.player?.name, e.secondPlayer?.name, teamName(team, f.lang)]
      ).filter(Boolean).join(' · ')}
      style={[{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10 }, border]}
    >
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        {home ? (
          <>
            {body}
            {icon}
          </>
        ) : null}
      </View>
      <Text variant="num" size={16} align="center" color={e.kind === 'goal' ? 'accentText' : 'text2'} style={{ width: 52 }}>
        {minute}
      </Text>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 8 }}>
        {!home ? (
          <>
            {icon}
            {body}
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

type EventView = 'top' | 'all';

export function EventTimeline({ events, match }: { events: MatchEvent[]; match: Match }) {
  const f = useFmt();
  const { c } = useTheme();
  const [view, setView] = useState<EventView>('top');
  if (!events.length) return <EmptyState message={f.t('match.noEvents')} />;
  // After the final whistle: the key moments first, the full timeline one tap away.
  const finished = match.state === 'finished';
  const rows = newestFirst(finished && view === 'top' ? topEvents(events) : events);
  const shootout = finished && match.home.penalties != null && match.away.penalties != null;
  return (
    <View style={{ gap: 12 }}>
      {finished ? (
        <Segmented<EventView>
          value={view}
          onChange={setView}
          options={[
            { value: 'top', label: f.t('match.topEvents') },
            { value: 'all', label: f.t('match.allEvents') },
          ]}
        />
      ) : null}
      {rows.length || shootout ? (
        <Card>
          {shootout ? (
            <View style={{ paddingVertical: 10, alignItems: 'center', backgroundColor: c.bg, borderBottomWidth: rows.length ? 1 : 0, borderBottomColor: c.line }}>
              <Text variant="label">{`${f.t('match.shootout')} · ${f.n(match.home.penalties)} – ${f.n(match.away.penalties)}`}</Text>
            </View>
          ) : null}
          {rows.map((e, i) => (
            <EventRow key={i} e={e} match={match} last={i === rows.length - 1} />
          ))}
        </Card>
      ) : (
        <EmptyState message={f.t('match.noTopEvents')} />
      )}
    </View>
  );
}

export function StatCompare({ label, home, away, suffix = '' }: { label: string; home: number; away: number; suffix?: string }) {
  const f = useFmt();
  const { c } = useTheme();
  const total = home + away || 1;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text variant="num" size={17}>{`${f.n(home)}${suffix}`}</Text>
        <Text variant="small" color="text2" align="center" style={{ flex: 1 }}>{label}</Text>
        <Text variant="num" size={17}>{`${f.n(away)}${suffix}`}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 4, height: 6 }}>
        <View style={{ flex: home / total, minWidth: 4, borderRadius: 3, backgroundColor: c.accent }} />
        <View style={{ flex: away / total, minWidth: 4, borderRadius: 3, backgroundColor: c.text }} />
      </View>
    </View>
  );
}

export function MatchStats({ stats, match }: { stats: MatchStat[]; match: Match }) {
  const f = useFmt();
  if (!stats.length) return <EmptyState message={f.t('match.noStats')} />;
  return (
    <Card style={{ padding: 16, gap: 16 }}>
      <View style={{ flexDirection: 'row' }}>
        <Text variant="label" style={{ flex: 1 }}>{teamName(match.home, f.lang)}</Text>
        <Text variant="label" style={{ flex: 1, textAlign: 'right' }}>{teamName(match.away, f.lang)}</Text>
      </View>
      {stats.map((s) => (
        <StatCompare key={s.key} label={f.t(`match.stats.${s.key}`)} home={s.home} away={s.away} suffix={s.key === 'possession' ? '%' : ''} />
      ))}
    </Card>
  );
}

function PitchPlayer({ p, best }: { p: LineupPlayer; best: number }) {
  const f = useFmt();
  const { c } = useTheme();
  const [failed, setFailed] = useState(false);
  const photo = p.image && !failed ? p.image : null;
  const last = p.name.trim().split(/\s+/).slice(-1)[0] ?? p.name;
  return (
    <Pressable onPress={() => router.push(paths.player(p.id))} accessibilityRole="button" accessibilityLabel={p.name} style={{ width: 72, alignItems: 'center', gap: 3 }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: photo ? c.surface2 : c.discBg, borderWidth: photo ? 2 : 0, borderColor: c.discBg, alignItems: 'center', justifyContent: 'center' }}>
        {photo ? (
          <Image source={{ uri: photo }} style={{ width: 36, height: 36, borderRadius: 18 }} contentFit="cover" contentPosition="top" onError={() => setFailed(true)} />
        ) : (
          <Text variant="num" size={15} weight={800} style={{ color: c.discFg }}>{f.n(p.number)}</Text>
        )}
        {photo && p.number != null ? (
          <View style={{ position: 'absolute', bottom: -4, left: -8, minWidth: 18, height: 18, paddingHorizontal: 3, borderRadius: 9, backgroundColor: c.discBg, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="num" size={10.5} weight={800} style={{ color: c.discFg, lineHeight: 14 }}>{f.n(p.number)}</Text>
          </View>
        ) : null}
        {p.goals > 0 || p.yellowCard || p.redCard ? (
          <View style={{ position: 'absolute', top: -6, right: -10, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            {p.goals > 0 ? <Icon name="ball" size={14} /> : null}
            {p.yellowCard ? <CardIcon small /> : null}
            {p.redCard ? <CardIcon red small /> : null}
          </View>
        ) : null}
      </View>
      <Text variant="caption" numberOfLines={1} style={{ maxWidth: 72 }}>{last}</Text>
      {p.subMinute || p.rating != null ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {p.subMinute ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 1 }} accessibilityLabel={`${f.t('match.subOff')} ${f.digits(p.subMinute)}${f.t('match.minute')}`}>
              <Icon name="sub" size={14} color={c.accentText} />
              <Text variant="num" size={11} color="accentText">{`${f.digits(p.subMinute)}'`}</Text>
            </View>
          ) : null}
          {p.rating != null ? (
            <View style={{ paddingHorizontal: 4, borderRadius: 6, backgroundColor: p.rating === best ? c.accent : c.bg, borderWidth: 1, borderColor: p.rating === best ? c.accent : c.line }}>
              <Text variant="num" size={11} color={p.rating === best ? 'onAccent' : 'text'}>{f.n(p.rating)}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

export function Lineups({ lineups }: { lineups: Lineup[] }) {
  const f = useFmt();
  const { c, radius } = useTheme();
  const [index, setIndex] = useState(0);
  const withPlayers = lineups.filter((l) => l.hasLineup && l.rows.length);
  if (!withPlayers.length) return <EmptyState message={f.t('match.noLineup')} />;
  const l = withPlayers[Math.min(index, withPlayers.length - 1)]!;
  const best = Math.max(0, ...withPlayers.flatMap((x) => x.rows.flat().map((p) => p.rating ?? 0)));
  return (
    <View style={{ gap: 14 }}>
      {withPlayers.length > 1 ? <Segmented value={index} onChange={setIndex} options={withPlayers.map((x, i) => ({ value: i, label: x.teamName }))} /> : null}
      {l.formation ? <Text variant="small" color="text2">{`${f.t('match.formation')}: ${f.digits(l.formation)}`}</Text> : null}
      {/* The pitch is a picture of the field: never mirrored, so it keeps LTR geometry. */}
      <View style={{ direction: 'ltr', aspectRatio: 68 / 96, width: '100%', backgroundColor: c.surface, borderRadius: radius.card, paddingVertical: 14, justifyContent: 'space-around', flexDirection: 'column-reverse', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, backgroundColor: c.line }} />
        {l.rows.map((row, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {row.map((p) => (
              <PitchPlayer key={p.id} p={p} best={best} />
            ))}
          </View>
        ))}
      </View>
      <Card style={{ padding: 14, gap: 4 }}>
        <Text variant="label">{f.t('match.subs')}</Text>
        {l.subs.map((p) => (
          <Pressable key={p.id} onPress={() => router.push(paths.player(p.id))} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.line }}>
            <Text variant="num" style={{ width: 28 }}>{f.n(p.number)}</Text>
            <Avatar name={p.name} image={p.image} size={28} />
            <View style={{ flex: 1 }}>
              <Text variant="small">{p.name}</Text>
              {p.subMinute && p.swapName ? (
                <Text variant="caption" color="text2">{f.t('match.subFor', { name: p.swapName })}</Text>
              ) : null}
            </View>
            {p.subMinute ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Icon name="sub" size={14} color={c.accentText} />
                <Text variant="caption" color="text2">{`${f.t('match.subOn')} ${f.digits(p.subMinute)}${f.t('match.minute')}`}</Text>
              </View>
            ) : null}
            {p.rating != null ? (
              <View style={{ paddingHorizontal: 4, borderRadius: 6, borderWidth: 1, borderColor: c.line }}>
                <Text variant="num" size={11}>{f.n(p.rating)}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
        {l.manager ? <Text variant="small" color="text2">{`${f.t('match.manager')}: ${l.manager}`}</Text> : null}
      </Card>
    </View>
  );
}

export function HeadToHeadView({ data }: { data: HeadToHead }) {
  const f = useFmt();
  if (!data.meetings.length) return <EmptyState message={f.t('match.noMeetings')} />;
  const [a, b] = data.totals;
  const meetings: Match[] = data.meetings.map((m) => ({
    id: m.id, sportId: 1, kickoff: m.kickoff, state: 'finished', statusLabel: '', phase: null, clock: null,
    home: m.home, away: m.away, competition: m.competition, stage: null, venue: m.venue, regionIds: [],
  }));
  return (
    <View style={{ gap: 14 }}>
      <MatchList matches={meetings} meta={(m) => f.date(m.kickoff)} />
      {a && b ? (
        <Card style={{ padding: 16, gap: 14 }}>
          <Text variant="label">{f.t('match.totals')}</Text>
          <StatCompare label={f.t('match.stats.shotsOnTarget')} home={a.shotsOnTarget} away={b.shotsOnTarget} />
          <StatCompare label={f.t('match.stats.passes')} home={a.passes} away={b.passes} />
          <StatCompare label={f.t('match.stats.yellowCards')} home={a.yellowCards} away={b.yellowCards} />
          <StatCompare label={f.t('match.stats.passAccuracy')} home={a.passAccuracy} away={b.passAccuracy} suffix="%" />
          <Text variant="caption" color="text2">{`${a.teamName} / ${b.teamName}`}</Text>
        </Card>
      ) : null}
    </View>
  );
}
