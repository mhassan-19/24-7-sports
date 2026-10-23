import type { SeasonQuery } from '@sports247/api';
import {
  useBracket,
  useCompetition,
  useCompetitionCalendar,
  useCompetitionMatches,
  useCompetitionTeams,
  useCompetitions,
  useCupProgress,
  useHonours,
  useLeaderBoards,
  useStandings,
  useTeamOfTheWeek,
} from '@sports247/data';
import type { CompetitionDetail, LeaderBoards } from '@sports247/domain';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Bracket, LeaderList, StandingsTable } from '../../../src/features/competition';
import { MatchList } from '../../../src/features/match';
import { paths, useFmt } from '../../../src/lib/locale';
import { useSeasonQuery } from '../../../src/lib/misc';
import { useTheme } from '../../../src/lib/theme';
import { Button, Card, Chip, Chips, Crest, LinkText, Row, Screen, Section, Segmented } from '../../../src/ui/primitives';
import { EmptyState, QueryView, Skeleton } from '../../../src/ui/states';
import { Text } from '../../../src/ui/Text';

type Tab = 'overview' | 'table' | 'matches' | 'bracket' | 'stats' | 'teams' | 'history';

/** Same rules as the website: `has_standing` from the list, or a cup with groups, gets a table. */
function tabsFor(c: CompetitionDetail, listedHasStandings: boolean | undefined): Tab[] {
  const hasTable = listedHasStandings === true || c.hasGroups;
  if (c.format === 'cup') return ['overview', ...(hasTable ? (['table'] as Tab[]) : []), 'matches', 'bracket', 'stats', 'teams', 'history'];
  return ['table', 'matches', 'stats', 'teams', 'history'];
}

export default function CompetitionScreen() {
  const f = useFmt();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const competition = useCompetition(id);
  const listed = useCompetitions().data?.find((x) => x.id === id);
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const season = useSeasonQuery(id, seasonId);
  const [tab, setTab] = useState<Tab | null>(null);

  return (
    <Screen title={competition.data?.title ?? f.t('nav.competitions')} onRefresh={() => competition.refetch()}>
      <QueryView query={competition} skeleton={<Skeleton rows={4} height={70} />}>
        {(comp) => {
          const tabs = tabsFor(comp, listed?.hasStandings);
          const current = tab && tabs.includes(tab) ? tab : tabs[0]!;
          return (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Crest name={comp.title} logo={comp.logo} size={64} />
                <Text variant="h1" style={{ flex: 1 }}>{comp.title}</Text>
              </View>
              {comp.seasons.length > 1 && season ? (
                <Chips>
                  {comp.seasons.map((s) => (
                    <Chip key={s.id} pressed={season.seasonId === s.id} onPress={() => setSeasonId(String(s.id))}>
                      {f.digits(s.title)}
                    </Chip>
                  ))}
                </Chips>
              ) : null}
              <Segmented<Tab> value={current} onChange={setTab} options={tabs.map((t) => ({ value: t, label: f.t(`competition.tabs.${t}`) }))} />
              {season ? <TabBody tab={current} comp={comp} season={season} /> : <Skeleton />}
            </>
          );
        }}
      </QueryView>
    </Screen>
  );
}

function TabBody({ tab, comp, season }: { tab: Tab; comp: CompetitionDetail; season: SeasonQuery }) {
  switch (tab) {
    case 'overview':
      return <Overview comp={comp} season={season} />;
    case 'table':
      return <TableTab season={season} grouped={comp.hasGroups} />;
    case 'matches':
      return <MatchesTab season={season} />;
    case 'bracket':
      return <BracketTab season={season} />;
    case 'stats':
      return <StatsTab comp={comp} season={season} />;
    case 'teams':
      return <TeamsTab season={season} />;
    case 'history':
      return <HistoryTab comp={comp} />;
  }
}

function TableTab({ season, grouped }: { season: SeasonQuery; grouped: boolean }) {
  const f = useFmt();
  const standings = useStandings(season, grouped);
  return (
    <QueryView query={standings} isEmpty={(d) => !d.groups.length} empty={<EmptyState message={f.t('competition.noTable')} />}>
      {(d) => (
        <>
          {d.groups.map((g, i) => (
            <Section key={i} title={d.groups.length > 1 ? (g.name ?? undefined) : undefined}>
              <StandingsTable rows={g.rows} />
            </Section>
          ))}
          <Text variant="caption" color="text2">{f.t('competition.formLegend')}</Text>
        </>
      )}
    </QueryView>
  );
}

function MatchesTab({ season }: { season: SeasonQuery }) {
  const f = useFmt();
  const calendar = useCompetitionCalendar(season);
  const all = useCompetitionMatches(season);
  const items = all.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <>
      <QueryView query={calendar}>
        {(d) => (
          <>
            {d.today.length > 0 && <Section title={f.t('common.today')}><MatchList matches={d.today} /></Section>}
            {d.next.length > 0 && <Section title={f.t('common.next')}><MatchList matches={d.next} /></Section>}
            {d.previous.length > 0 && <Section title={f.t('common.previous')}><MatchList matches={d.previous} /></Section>}
          </>
        )}
      </QueryView>
      <Section title={f.t('nav.matches')}>
        {all.isPending ? (
          <Skeleton />
        ) : items.length ? (
          <>
            <MatchList matches={items} />
            {all.hasNextPage ? <Button variant="secondary" disabled={all.isFetchingNextPage} onPress={() => void all.fetchNextPage()}>{f.t('common.loadMore')}</Button> : null}
          </>
        ) : (
          <EmptyState message={f.t('match.noMatchesDay')} />
        )}
      </Section>
    </>
  );
}

function BracketTab({ season }: { season: SeasonQuery }) {
  const f = useFmt();
  const bracket = useBracket(season);
  return (
    <QueryView query={bracket} isEmpty={(d) => !d.length} empty={<EmptyState message={f.t('competition.noBracket')} />}>
      {(d) => <Bracket rounds={d} />}
    </QueryView>
  );
}

const KINDS = ['topScorers', 'topAssists', 'cleanSheets', 'passes'] as const;

function StatsTab({ comp, season }: { comp: CompetitionDetail; season: SeasonQuery }) {
  const f = useFmt();
  const leaders = useLeaderBoards(season);
  const [kind, setKind] = useState<keyof LeaderBoards>('topScorers');
  const full = kind === 'topScorers' ? 'scorers' : kind === 'topAssists' ? 'assists' : null;
  return (
    <QueryView query={leaders} isEmpty={(d) => KINDS.every((k) => !d[k].length)} empty={<EmptyState message={f.t('states.empty')} />}>
      {(d) => (
        <>
          <Segmented value={kind} onChange={setKind} options={KINDS.filter((k) => d[k].length).map((k) => ({ value: k, label: f.t(`competition.leaders.${k}`) }))} />
          <LeaderList leaders={d[kind]} />
          {full ? <LinkText onPress={() => router.push(paths.leaders(comp.id, full, season.seasonId) as never)}>{f.t('common.seeAll')}</LinkText> : null}
        </>
      )}
    </QueryView>
  );
}

function TeamsTab({ season }: { season: SeasonQuery }) {
  const f = useFmt();
  const teams = useCompetitionTeams(season);
  return (
    <QueryView query={teams} isEmpty={(d) => !d.length} empty={<EmptyState message={f.t('states.empty')} />}>
      {(d) => (
        <Card>
          {d.map((t, i) => (
            <Row key={t.id} last={i === d.length - 1} onPress={() => router.push(paths.team(t.id))} label={t.name} lead={<Crest name={t.name} logo={t.logo} />}>
              <Text variant="label">{t.name}</Text>
            </Row>
          ))}
        </Card>
      )}
    </QueryView>
  );
}

function Overview({ comp, season }: { comp: CompetitionDetail; season: SeasonQuery }) {
  const f = useFmt();
  const { c, radius } = useTheme();
  const progress = useCupProgress(season);
  const totw = useTeamOfTheWeek(comp.id);
  return (
    <>
      <QueryView query={progress} isEmpty={(d) => !d.stages.length} empty={null}>
        {(d) => (
          <Section title={f.t('competition.progress')}>
            <Card style={{ padding: 16, gap: 12 }}>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: c.surface2, overflow: 'hidden' }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: d.percentage }}>
                <View style={{ height: 8, width: `${Math.min(100, d.percentage)}%`, backgroundColor: c.accent }} />
              </View>
              {d.stages.map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <Text variant="small">{s.name}</Text>
                  {s.total != null ? <Text variant="caption" color="text2">{f.t('competition.progressStage', { completed: f.n(s.completed ?? 0), total: f.n(s.total) })}</Text> : null}
                </View>
              ))}
            </Card>
          </Section>
        )}
      </QueryView>
      {totw.data && totw.data[0] ? (
        <Section title={f.t('competition.teamOfTheWeek')}>
          <Image source={{ uri: totw.data[0].image }} style={{ width: '100%', aspectRatio: 1, borderRadius: radius.card }} contentFit="contain" accessibilityLabel={f.t('competition.week', { n: f.n(totw.data[0].week) })} />
          <Text variant="caption" color="text2">{f.t('competition.week', { n: f.n(totw.data[0].week) })}</Text>
        </Section>
      ) : null}
    </>
  );
}

function HistoryTab({ comp }: { comp: CompetitionDetail }) {
  const f = useFmt();
  const honours = useHonours(comp.id);
  return (
    <QueryView query={honours} isEmpty={(d) => !d.winners.length && !d.lastWinner && !d.mostTitles} empty={<EmptyState message={f.t('competition.noHonours')} />}>
      {(d) => (
        <>
          {(d.lastWinner || d.mostTitles) && (
            <Card>
              {[
                d.lastWinner && { t: d.lastWinner, label: f.t('competition.lastWinner') },
                d.mostTitles && { t: d.mostTitles, label: f.t('competition.mostTitles') },
              ]
                .filter((x): x is NonNullable<typeof x> => !!x)
                .map((x, i, arr) => (
                  <Row key={x.label} last={i === arr.length - 1} onPress={() => router.push(paths.team(x.t.id))} lead={<Crest name={x.t.name} logo={x.t.logo} />} trail={<Text variant="caption" color="text2">{x.label}</Text>}>
                    <Text variant="label">{x.t.name}</Text>
                  </Row>
                ))}
            </Card>
          )}
          {d.winners.length > 0 && (
            <Section title={f.t('competition.winners')}>
              <Card>
                {d.winners.map((w, i) => (
                  <Row key={w.team.id} last={i === d.winners.length - 1} onPress={() => router.push(paths.team(w.team.id))} lead={<Crest name={w.team.name} logo={w.team.logo} />} trail={w.titles > 0 ? <Text variant="num">{f.tn('competition.titles', w.titles)}</Text> : undefined}>
                    <Text variant="label">{w.team.name}</Text>
                    {w.seasons ? <Text variant="caption" color="text2">{f.digits(w.seasons)}</Text> : null}
                  </Row>
                ))}
              </Card>
            </Section>
          )}
        </>
      )}
    </QueryView>
  );
}
