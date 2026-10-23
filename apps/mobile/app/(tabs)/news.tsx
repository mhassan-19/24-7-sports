import { useNews } from '@sports247/data';
import { View } from 'react-native';
import { NewsCard, NewsRow } from '../../src/features/news';
import { useFmt } from '../../src/lib/locale';
import { Button, Screen } from '../../src/ui/primitives';
import { EmptyState, ErrorState, Skeleton } from '../../src/ui/states';

export default function News() {
  const f = useFmt();
  const q = useNews();
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  const [lead, ...rest] = items;
  return (
    <Screen top title={f.t('nav.news')} onRefresh={() => q.refetch()}>
      {q.isPending ? (
        <Skeleton rows={4} height={110} />
      ) : !q.data ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : !lead ? (
        <EmptyState message={f.t('news.empty')} />
      ) : (
        <View style={{ gap: 8 }}>
          <NewsCard item={lead} lead />
          {rest.map((a) => <NewsRow key={a.id} item={a} />)}
          {q.hasNextPage ? (
            <View style={{ paddingTop: 8 }}>
              <Button variant="secondary" disabled={q.isFetchingNextPage} onPress={() => void q.fetchNextPage()}>{f.t('common.loadMore')}</Button>
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
