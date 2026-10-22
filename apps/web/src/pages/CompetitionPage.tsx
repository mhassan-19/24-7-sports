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
  useRegions,
  useStandings,
  useTeamOfTheWeek,
} from '@sports247/data';
import type { CompetitionDetail, LeaderBoards } from '@sports247/domain';
import { useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router';
import { Bracket, LeaderList, StandingsTable, competitionStyles as c } from '../features/competition/CompetitionParts';
import { MatchList } from '../features/match/MatchRow';
import { usePaths, useFmt } from '../lib/locale';
import { useSeasonQuery } from '../lib/season';
import {
  Breadcrumbs,
  Button,
  Crest,
  Eyebrow,
  H1,
  List,
  Panel,
  Row,
  Section,
  SeeAll,
  Segmented,
  Select,
  TabsNav,
} from '../ui/primitives';
import { EmptyState, QueryView, Skeleton } from '../ui/states';
import { Seo } from '../ui/Seo';
import p from './pages.module.css';

type Tab = 'overview' | 'table' | 'matches' | 'bracket' | 'stats' | 'teams' | 'history';

/**
 * `has_standing` comes from the competitions list (the detail endpoint lacks it); cups with groups
 * have a table too even when the flag is off (AFCON).
 */
function tabsFor(c: CompetitionDetail, listedHasStandings: boolean | undefined): Tab[] {
  const hasTable = listedHasStandings === true || c.hasGroups;
  if (c.format === 'cup') return ['overview', ...(hasTable ? (['table'] as Tab[]) : []), 'matches', 'bracket', 'stats', 'teams', 'history'];
  return ['table', 'matches', 'stats', 'teams', 'history'];
}

export default function CompetitionPage() {
  const f = useFmt();
  const paths = usePaths();
  const params = useParams();
  const [search, setSearch] = useSearchParams();
  const id = Number(params.id);
  const competition = useCompetition(id);
  const season = useSeasonQuery(id, search.get('season'));
  const regions = useRegions();
  const listed = useCompetitions().data?.find((x) => x.id === id);

  return (
    <QueryView query={competition} skeleton={<Skeleton rows={4} height={72} />}>
      {(comp) => {
        const tabs = tabsFor(comp, listed?.hasStandings);
        const tab = (params.tab ?? tabs[0]) as Tab;
        if (!tabs.includes(tab)) return <Navigate to={paths.competition(id)} replace />;
        const qs = search.toString() ? `?${search.toString()}` : '';
        return (
          <div className={p.stack}>
            <Seo title={comp.title} />
            <Breadcrumbs
              label={f.t('nav.breadcrumb')}
              items={[{ label: f.t('nav.competitions'), to: paths.competitions() }, { label: <bdi>{comp.title}</bdi> }]}
            />
            <header className={p.entity}>
              <Crest name={comp.title} logo={comp.logo} size={72} />
              <div>
                {(() => {
                  const r = regions.data?.find((x) => x.id === comp.regionId);
                  return r ? <Eyebrow>{f.lang === 'ar' ? r.nameAr : r.nameEn}</Eyebrow> : null;
                })()}
                <H1 upper>
                  <bdi>{comp.title}</bdi>
                </H1>
                {comp.seasons.length > 0 && season && (
                  <div>
                    <Select
                      id="season"
                      label={f.t('common.season')}
                      value={String(season.seasonId)}
                      options={comp.seasons.map((s) => ({ value: String(s.id), label: f.digits(s.title) }))}
                      onChange={(v) => {
                        const sp = new URLSearchParams(search);
                        sp.set('season', v);
                        setSearch(sp, { replace: true });
                      }}
                    />
                  </div>
                )}
              </div>
            </header>
            <TabsNav
              label={f.t('nav.tabs')}
              items={tabs.map((t, i) => ({ to: `${i === 0 ? paths.competition(id) : paths.competition(id, t)}${qs}`, label: f.t(`competition.tabs.${t}`) }))}
            />
            {season ? <TabBody tab={tab} comp={comp} season={season} /> : <Skeleton />}
          </div>
        );
      }}
    </QueryView>
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
            // A single group is just the table: its API name (e.g. "Premier League 26/27") adds nothing.
            <Section key={i} title={d.groups.length > 1 ? (g.name ?? undefined) : undefined}>
              <StandingsTable rows={g.rows} />
            </Section>
          ))}
          <p className="small muted">{f.t('competition.formLegend')}</p>
        </>
      )}
    </QueryView>
  );
}

function MatchesTab({ season }: { season: SeasonQuery }) {
  const f = useFmt();
  const calendar = useCompetitionCalendar(season);
  const all = useCompetitionMatches(season);
  const items = all.data?.pages.flatMap((pg) => pg.items) ?? [];
  return (
    <>
      <QueryView query={calendar}>
        {(d) => (
          <>
            {d.today.length > 0 && (
              <Section title={f.t('common.today')}>
                <MatchList matches={d.today} />
              </Section>
            )}
            {d.previous.length > 0 && (
              <Section title={f.t('common.previous')}>
                <MatchList matches={d.previous} />
              </Section>
            )}
            {d.next.length > 0 && (
              <Section title={f.t('common.next')}>
                <MatchList matches={d.next} />
              </Section>
            )}
          </>
        )}
      </QueryView>
      <Section title={f.t('nav.matches')}>
        {all.isPending ? (
          <Skeleton />
        ) : items.length ? (
          <>
            <MatchList matches={items} />
            {all.hasNextPage && (
              <div>
                <Button variant="secondary" onClick={() => void all.fetchNextPage()} disabled={all.isFetchingNextPage}>
                  {f.t('common.loadMore')}
                </Button>
              </div>
            )}
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

const LEADER_KINDS = ['topScorers', 'topAssists', 'cleanSheets', 'passes'] as const;

function StatsTab({ comp, season }: { comp: CompetitionDetail; season: SeasonQuery }) {
  const f = useFmt();
  const paths = usePaths();
  const leaders = useLeaderBoards(season);
  const [kind, setKind] = useState<keyof LeaderBoards>('topScorers');
  const full = kind === 'topScorers' ? 'scorers' : kind === 'topAssists' ? 'assists' : null;
  return (
    <QueryView query={leaders} isEmpty={(d) => LEADER_KINDS.every((k) => !d[k].length)} empty={<EmptyState message={f.t('states.empty')} />}>
      {(d) => (
        <>
          <Segmented
            label={f.t('competition.tabs.stats')}
            value={kind}
            onChange={setKind}
            options={LEADER_KINDS.filter((k) => d[k].length).map((k) => ({ value: k, label: f.t(`competition.leaders.${k}`) }))}
          />
          <LeaderList leaders={d[kind]} />
          {full && (
            <div>
              <SeeAll to={`${paths.leaders(comp.id, full)}?season=${season.seasonId}`}>{f.t('common.seeAll')}</SeeAll>
            </div>
          )}
        </>
      )}
    </QueryView>
  );
}

function TeamsTab({ season }: { season: SeasonQuery }) {
  const f = useFmt();
  const paths = usePaths();
  const teams = useCompetitionTeams(season);
  return (
    <QueryView query={teams} isEmpty={(d) => !d.length} empty={<EmptyState message={f.t('states.empty')} />}>
      {(d) => (
        <List className={c.gridTeams}>
          {d.map((t) => (
            <Row key={t.id} to={paths.team(t.id)} lead={<Crest name={t.name} logo={t.logo} />}>
              <bdi>{t.name}</bdi>
            </Row>
          ))}
        </List>
      )}
    </QueryView>
  );
}

function Overview({ comp, season }: { comp: CompetitionDetail; season: SeasonQuery }) {
  const f = useFmt();
  const progress = useCupProgress(season);
  const totw = useTeamOfTheWeek(comp.id);
  return (
    <>
      <QueryView query={progress} isEmpty={(d) => !d.stages.length} empty={null} skeleton={<Skeleton rows={3} height={40} />}>
        {(d) => (
          <Section title={f.t('competition.progress')}>
            <Panel>
              <div className={c.progress} role="progressbar" aria-valuenow={d.percentage} aria-valuemin={0} aria-valuemax={100} aria-label={f.t('competition.progress')}>
                <i style={{ inlineSize: `${Math.min(100, d.percentage)}%` }} />
              </div>
              {d.stages.map((st, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <bdi>{st.name}</bdi>
                  {st.total != null && (
                    <span className="small muted">
                      {f.t('competition.progressStage', { completed: f.n(st.completed ?? 0), total: f.n(st.total) })}
                    </span>
                  )}
                </div>
              ))}
            </Panel>
          </Section>
        )}
      </QueryView>
      {totw.data && totw.data.length > 0 && (
        <Section title={f.t('competition.teamOfTheWeek')}>
          {totw.data.slice(0, 1).map((w) => (
            <figure key={w.id} style={{ margin: 0, display: 'grid', gap: 8 }}>
              <img src={w.image} alt={`${f.t('competition.teamOfTheWeek')} · ${f.t('competition.week', { n: f.n(w.week) })}`} loading="lazy" style={{ borderRadius: 16, inlineSize: '100%', maxInlineSize: 720 }} />
              <figcaption className="small muted">{f.t('competition.week', { n: f.n(w.week) })}</figcaption>
            </figure>
          ))}
        </Section>
      )}
      {!progress.data?.stages.length && !totw.data?.length && !progress.isPending && <EmptyState message={f.t('states.empty')} />}
    </>
  );
}

function HistoryTab({ comp }: { comp: CompetitionDetail }) {
  const f = useFmt();
  const paths = usePaths();
  const honours = useHonours(comp.id);
  return (
    <QueryView
      query={honours}
      isEmpty={(d) => !d.winners.length && !d.lastWinner && !d.mostTitles}
      empty={<EmptyState message={f.t('competition.noHonours')} />}
    >
      {(d) => (
        <>
          {(d.lastWinner || d.mostTitles) && (
            <List>
              {d.lastWinner && (
                <Row to={paths.team(d.lastWinner.id)} lead={<Crest name={d.lastWinner.name} logo={d.lastWinner.logo} />} trail={<span className="small muted">{f.t('competition.lastWinner')}</span>}>
                  <bdi>{d.lastWinner.name}</bdi>
                </Row>
              )}
              {d.mostTitles && (
                <Row to={paths.team(d.mostTitles.id)} lead={<Crest name={d.mostTitles.name} logo={d.mostTitles.logo} />} trail={<span className="small muted">{f.t('competition.mostTitles')}</span>}>
                  <bdi>{d.mostTitles.name}</bdi>
                </Row>
              )}
            </List>
          )}
          {d.winners.length > 0 && (
            <Section title={f.t('competition.winners')}>
              <List>
                {d.winners.map((w) => (
                  <Row key={w.team.id} to={paths.team(w.team.id)} lead={<Crest name={w.team.name} logo={w.team.logo} />} trail={w.titles > 0 ? <span className="num">{f.tn('competition.titles', w.titles)}</span> : null}>
                    <bdi>{w.team.name}</bdi>
                    {w.seasons && <span className="small muted">{f.digits(w.seasons)}</span>}
                  </Row>
                ))}
              </List>
            </Section>
          )}
        </>
      )}
    </QueryView>
  );
}
