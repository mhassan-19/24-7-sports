import { useHeadToHead, useLineups, useMatch, useMatchEvents, useMatchNews } from '@sports247/data';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { EventTimeline, HeadToHeadView, Lineups, MatchHeader, MatchStats, teamName } from '../../../src/features/match';
import { NewsRow } from '../../../src/features/news';
import { useFmt } from '../../../src/lib/locale';
import { Screen, Segmented } from '../../../src/ui/primitives';
import { EmptyState, QueryView, Skeleton } from '../../../src/ui/states';

const TABS = ['events', 'lineups', 'stats', 'h2h', 'news'] as const;
type Tab = (typeof TABS)[number];

export default function MatchScreen() {
  const f = useFmt();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const [tab, setTab] = useState<Tab>('events');
  const detail = useMatch(id);
  const live = detail.data?.match.state === 'live';
  const events = useMatchEvents(id, live, tab === 'events');
  const lineups = useLineups(id, live, tab === 'lineups');
  const h2h = useHeadToHead(id, tab === 'h2h');
  const news = useMatchNews(id, tab === 'news');
  const title = detail.data ? `${teamName(detail.data.match.home, f.lang)} – ${teamName(detail.data.match.away, f.lang)}` : f.t('nav.matches');

  return (
    <Screen title={title} onRefresh={() => Promise.all([detail.refetch(), tab === 'events' ? events.refetch() : null])}>
      <QueryView query={detail} skeleton={<Skeleton rows={4} height={80} />}>
        {({ match, stats }) => (
          <>
            <MatchHeader match={match} />
            <Segmented<Tab> value={tab} onChange={setTab} options={TABS.map((t) => ({ value: t, label: f.t(`match.tabs.${t}`) }))} />
            {tab === 'events' && <QueryView query={events}>{(d) => <EventTimeline events={d} match={match} />}</QueryView>}
            {tab === 'lineups' && <QueryView query={lineups}>{(d) => <Lineups lineups={d} />}</QueryView>}
            {tab === 'stats' && <MatchStats stats={stats} match={match} />}
            {tab === 'h2h' && <QueryView query={h2h}>{(d) => <HeadToHeadView data={d} />}</QueryView>}
            {tab === 'news' && (
              <QueryView query={news} isEmpty={(d) => !d.length} empty={<EmptyState message={f.t('match.noNews')} />}>
                {(d) => <View>{d.map((a) => <NewsRow key={a.id} item={a} />)}</View>}
              </QueryView>
            )}
          </>
        )}
      </QueryView>
    </Screen>
  );
}
