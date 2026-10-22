import { useHeadToHead, useLineups, useMatch, useMatchEvents, useMatchNews } from '@sports247/data';
import { Navigate, useParams } from 'react-router';
import { EventTimeline, HeadToHeadView, Lineups, MatchHeader, MatchStats } from '../features/match/MatchParts';
import { teamName } from '../features/match/MatchRow';
import { NewsRow } from '../features/news/NewsParts';
import { usePaths, useFmt } from '../lib/locale';
import { Breadcrumbs, TabsNav } from '../ui/primitives';
import { EmptyState, QueryView, Skeleton } from '../ui/states';
import { Seo } from '../ui/Seo';
import p from './pages.module.css';

const TABS = ['events', 'lineups', 'stats', 'h2h', 'news'] as const;
type Tab = (typeof TABS)[number];

export default function MatchPage() {
  const f = useFmt();
  const paths = usePaths();
  const params = useParams();
  const id = Number(params.id);
  const tab: Tab | null = params.tab ? (TABS.includes(params.tab as Tab) ? (params.tab as Tab) : null) : 'events';

  const detail = useMatch(id);
  const live = detail.data?.match.state === 'live';
  const events = useMatchEvents(id, live, tab === 'events');
  const lineups = useLineups(id, live, tab === 'lineups');
  const h2h = useHeadToHead(id, tab === 'h2h');
  const news = useMatchNews(id, tab === 'news');

  if (!Number.isFinite(id) || tab === null) return <Navigate to={paths.match(id || 0)} replace />;

  return (
    <QueryView query={detail} skeleton={<Skeleton rows={4} height={88} />}>
      {({ match, stats }) => {
        const title = `${teamName(match.home, f.lang)} – ${teamName(match.away, f.lang)}`;
        return (
          <div className={p.stack}>
            <Seo title={title} description={match.competition?.title} />
            <Breadcrumbs
              label={f.t('nav.breadcrumb')}
              items={[
                { label: f.t('nav.matches'), to: paths.matches() },
                ...(match.competition ? [{ label: <bdi>{match.competition.title}</bdi>, to: paths.competition(match.competition.id) }] : []),
                { label: <bdi>{title}</bdi> },
              ]}
            />
            <h1 className="sr-only">{title}</h1>
            <MatchHeader match={match} />
            <TabsNav
              label={f.t('nav.tabs')}
              items={TABS.map((t) => ({ to: t === 'events' ? paths.match(id) : paths.match(id, t), label: f.t(`match.tabs.${t}`) }))}
            />
            {tab === 'events' && (
              <QueryView query={events}>{(d) => <EventTimeline events={d} match={match} />}</QueryView>
            )}
            {tab === 'lineups' && <QueryView query={lineups}>{(d) => <Lineups lineups={d} />}</QueryView>}
            {tab === 'stats' && <MatchStats stats={stats} match={match} />}
            {tab === 'h2h' && <QueryView query={h2h}>{(d) => <HeadToHeadView data={d} />}</QueryView>}
            {tab === 'news' && (
              <QueryView query={news} isEmpty={(d) => !d.length} empty={<EmptyState message={f.t('match.noNews')} />}>
                {(d) => (
                  <div>
                    {d.map((a) => (
                      <NewsRow key={a.id} item={a} />
                    ))}
                  </div>
                )}
              </QueryView>
            )}
          </div>
        );
      }}
    </QueryView>
  );
}
