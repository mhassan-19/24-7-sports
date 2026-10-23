import { useTransfers } from '@sports247/data';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { paths, useFmt } from '../../src/lib/locale';
import { useTheme } from '../../src/lib/theme';
import { Icon } from '../../src/ui/Icon';
import { Avatar, Badge, Button, Card, Screen } from '../../src/ui/primitives';
import { EmptyState, ErrorState, Skeleton } from '../../src/ui/states';
import { Text } from '../../src/ui/Text';

export default function Transfers() {
  const f = useFmt();
  const { c } = useTheme();
  const q = useTransfers();
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <Screen title={f.t('transfers.title')} onRefresh={() => q.refetch()}>
      {q.isPending ? (
        <Skeleton />
      ) : !q.data ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : !items.length ? (
        <EmptyState message={f.t('transfers.empty')} />
      ) : (
        <>
          <Card>
            {items.map((t, i) => (
              <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: i === items.length - 1 ? 0 : 1, borderBottomColor: c.line }}>
                <Avatar name={t.player.name} image={t.player.image} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Pressable onPress={() => router.push(paths.player(t.player.id))} accessibilityRole="button">
                    <Text variant="label">{t.player.name}</Text>
                  </Pressable>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }} accessibilityLabel={f.t('transfers.route', { from: t.from.name, to: t.to.name })}>
                    <Text variant="small" color="text2" onPress={() => router.push(paths.team(t.from.id))}>{t.from.name}</Text>
                    <Icon name="arrow" size={16} color={c.text2} />
                    <Text variant="label" onPress={() => router.push(paths.team(t.to.id))}>{t.to.name}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  {t.fee ? <Text variant="num" weight={800} style={{ writingDirection: 'ltr' }}>{t.fee}</Text> : null}
                  {t.contract ? <Badge>{t.contract}</Badge> : null}
                </View>
              </View>
            ))}
          </Card>
          {q.hasNextPage ? <Button variant="secondary" disabled={q.isFetchingNextPage} onPress={() => void q.fetchNextPage()}>{f.t('common.loadMore')}</Button> : null}
        </>
      )}
    </Screen>
  );
}
