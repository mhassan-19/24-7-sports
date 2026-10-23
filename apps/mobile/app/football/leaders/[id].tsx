import { useTopList } from '@sports247/data';
import { useLocalSearchParams } from 'expo-router';
import { LeaderList } from '../../../src/features/competition';
import { useFmt } from '../../../src/lib/locale';
import { useSeasonQuery } from '../../../src/lib/misc';
import { Screen } from '../../../src/ui/primitives';
import { EmptyState, QueryView } from '../../../src/ui/states';

export default function LeadersScreen() {
  const f = useFmt();
  const params = useLocalSearchParams<{ id: string; kind?: string; season?: string }>();
  const kind = params.kind === 'assists' ? 'assists' : 'scorers';
  const season = useSeasonQuery(Number(params.id), params.season);
  const list = useTopList(season, kind);
  return (
    <Screen title={f.t(kind === 'scorers' ? 'competition.leaders.topScorers' : 'competition.leaders.topAssists')} onRefresh={() => list.refetch()}>
      <QueryView query={list} isEmpty={(d) => !d.length} empty={<EmptyState message={f.t('states.empty')} />}>
        {(d) => <LeaderList leaders={d} />}
      </QueryView>
    </Screen>
  );
}
