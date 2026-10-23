import { useGames } from '@sports247/data';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { paths, useFmt } from '../../src/lib/locale';
import { useTheme } from '../../src/lib/theme';
import { Icon } from '../../src/ui/Icon';
import { Badge, Screen } from '../../src/ui/primitives';
import { EmptyState, QueryView } from '../../src/ui/states';
import { Text } from '../../src/ui/Text';

export default function GamesScreen() {
  const f = useFmt();
  const { c, radius } = useTheme();
  const games = useGames();
  return (
    <Screen title={f.t('games.title')} onRefresh={() => games.refetch()}>
      <QueryView query={games} isEmpty={(d) => !d.length} empty={<EmptyState message={f.t('games.empty')} />}>
        {(list) => (
          <View style={{ gap: 12 }}>
            {list.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => router.push(paths.game(g.id))}
                accessibilityRole="button"
                accessibilityLabel={`${g.title}, ${f.t(`games.types.${g.type}`)}`}
                style={({ pressed }) => ({ padding: 14, gap: 12, borderRadius: radius.card, backgroundColor: pressed ? c.surface2 : c.surface })}
              >
                <View style={{ aspectRatio: 16 / 9, borderRadius: 10, overflow: 'hidden', backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  {g.image ? <Image source={{ uri: g.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <Icon name="games" size={36} color={c.text3} />}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text variant="title" style={{ flex: 1 }} numberOfLines={2}>{g.title}</Text>
                  <Badge accent={g.type === 'match_predict'}>{f.t(`games.types.${g.type}`)}</Badge>
                </View>
                <Text variant="small" color="text2">{g.played ? f.t('games.played') : f.t('games.play')}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </QueryView>
    </Screen>
  );
}
