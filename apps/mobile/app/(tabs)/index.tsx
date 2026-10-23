import { useDayMatches, useLeaderBoards, useStandings, useTopStories } from '@sports247/data';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { LeaderList, StandingsTable } from '../../src/features/competition';
import { MatchGroups } from '../../src/features/match';
import { NewsCard, NewsRow } from '../../src/features/news';
import { paths, useFmt } from '../../src/lib/locale';
import { FEATURED_COMPETITION_ID, useSeasonQuery } from '../../src/lib/misc';
import { useTheme } from '../../src/lib/theme';
import { Slash } from '../../src/ui/brand';
import { Button, LinkText, Screen, Section, Segmented } from '../../src/ui/primitives';
import { EmptyState, QueryView, Skeleton } from '../../src/ui/states';
import { Text } from '../../src/ui/Text';

type Day = 'yesterday' | 'today' | 'tomorrow';

export default function Home() {
  const f = useFmt();
  const { c, radius } = useTheme();
  const [day, setDay] = useState<Day>('today');
  const days = useDayMatches();
  const stories = useTopStories();
  const featured = useSeasonQuery(FEATURED_COMPETITION_ID);
  const standings = useStandings(featured);
  const leaders = useLeaderBoards(featured);

  return (
    <Screen top title={f.t('nav.home')} onRefresh={() => Promise.all([days.refetch(), stories.refetch(), standings.refetch(), leaders.refetch()])}>
      <Section title={f.t('nav.matches')} action={<LinkText onPress={() => router.push(paths.matches())}>{f.t('common.seeAll')}</LinkText>}>
        <Segmented<Day> value={day} onChange={setDay} options={(['yesterday', 'today', 'tomorrow'] as Day[]).map((d) => ({ value: d, label: f.t(`days.${d}`) }))} />
        <QueryView
          query={days}
          isEmpty={(d) => d[day].length === 0}
          empty={
            <EmptyState
              message={f.t('match.noMatchesDay')}
              action={day !== 'tomorrow' ? <Button variant="ghost" onPress={() => setDay(day === 'yesterday' ? 'today' : 'tomorrow')}>{f.t(day === 'yesterday' ? 'days.today' : 'days.tomorrow')}</Button> : undefined}
            />
          }
        >
          {(d) => <MatchGroups matches={d[day].slice(0, 12)} />}
        </QueryView>
      </Section>

      {/* The one statement-orange panel on the screen. */}
      <View style={{ backgroundColor: c.brand.pulseOrange, borderRadius: radius.card, padding: 20, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} accessibilityRole="header">
          <Text variant="display" style={{ color: c.brand.midnight }}>{f.t('games.promoA')}</Text>
          <Slash height={32} width={4} color={c.brand.midnight} />
          <Text variant="display" style={{ color: c.brand.midnight }}>{f.t('games.promoB')}</Text>
        </View>
        <Text variant="label" style={{ color: c.brand.midnight }}>{f.t('games.promoText')}</Text>
        <Button variant="dark" onPress={() => router.push(paths.games())}>{f.t('nav.games')}</Button>
      </View>

      <Section title={f.t('news.topStories')} action={<LinkText onPress={() => router.push(paths.news())}>{f.t('common.seeAll')}</LinkText>}>
        <QueryView query={stories} isEmpty={(d) => !d.length} empty={<EmptyState message={f.t('news.empty')} />} skeleton={<Skeleton rows={3} height={90} />}>
          {([lead, ...rest]) => (
            <View style={{ gap: 6 }}>
              {lead ? <NewsCard item={lead} lead /> : null}
              {rest.slice(0, 3).map((a) => <NewsRow key={a.id} item={a} />)}
            </View>
          )}
        </QueryView>
      </Section>

      <Section title={f.t('competition.tabs.table')} action={<LinkText onPress={() => router.push(paths.competition(FEATURED_COMPETITION_ID))}>{f.t('common.seeAll')}</LinkText>}>
        <QueryView query={standings} isEmpty={(d) => !d.groups.length} empty={<EmptyState message={f.t('competition.noTable')} />} skeleton={<Skeleton rows={6} height={44} />}>
          {(d) => <StandingsTable rows={d.groups[0]!.rows.slice(0, 6)} compact />}
        </QueryView>
      </Section>

      <Section title={f.t('competition.leaders.topScorers')}>
        <QueryView query={leaders} isEmpty={(d) => !d.topScorers.length} empty={<EmptyState message={f.t('states.empty')} />}>
          {(d) => <LeaderList leaders={d.topScorers} limit={5} />}
        </QueryView>
      </Section>
    </Screen>
  );
}
