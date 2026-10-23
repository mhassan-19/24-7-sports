import { useSearch } from '@sports247/data';
import type { SearchKind } from '@sports247/domain';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { paths, useFmt } from '../src/lib/locale';
import { useTheme } from '../src/lib/theme';
import { Icon } from '../src/ui/Icon';
import { Avatar, Card, Crest, GUTTER, IconButton, Row, Section } from '../src/ui/primitives';
import { EmptyState, ErrorState, Skeleton } from '../src/ui/states';
import { Text } from '../src/ui/Text';

const KINDS: SearchKind[] = ['team', 'player', 'competition'];

/** Full-screen search (modal over the tabs), debounced like the website's. */
export default function SearchScreen() {
  const f = useFmt();
  const { c, radius } = useTheme();
  const [input, setInput] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebounced(input), 300);
    return () => clearTimeout(id);
  }, [input]);

  const q = useSearch(debounced);
  const term = debounced.trim();
  const open = (kind: SearchKind, id: number) =>
    router.push(kind === 'team' ? paths.team(id) : kind === 'player' ? paths.player(id) : paths.competition(id));

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderBottomWidth: 1, borderBottomColor: c.line }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 12, borderRadius: radius.small, backgroundColor: c.surface2 }}>
          <Icon name="search" size={20} color={c.text2} />
          <TextInput
            autoFocus
            value={input}
            onChangeText={setInput}
            placeholder={f.t('search.placeholder')}
            placeholderTextColor={c.text3}
            accessibilityLabel={f.t('nav.search')}
            returnKeyType="search"
            autoCorrect={false}
            style={{ flex: 1, color: c.text, fontFamily: f.lang === 'ar' ? 'Cairo_400Regular' : 'Barlow_400Regular', fontSize: 16, textAlign: f.rtl ? 'right' : 'left' }}
          />
          {input ? <IconButton icon="close" label={f.t('common.clear')} onPress={() => setInput('')} /> : null}
        </View>
        <IconButton icon="close" label={f.t('common.close')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>
      <ScrollView contentContainerStyle={{ padding: GUTTER, gap: 24 }} keyboardShouldPersistTaps="handled" accessibilityLiveRegion="polite">
        {term.length < 2 ? (
          <Text color="text2">{f.t('search.hint')}</Text>
        ) : q.isPending ? (
          <Skeleton rows={5} />
        ) : !q.data ? (
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        ) : !q.data.length ? (
          <EmptyState message={f.t('search.empty')} />
        ) : (
          KINDS.map((kind) => {
            const hits = q.data.filter((r) => r.kind === kind);
            if (!hits.length) return null;
            return (
              <Section key={kind} title={f.t(`search.kinds.${kind}`)}>
                <Card>
                  {hits.map((r, i) => (
                    <Row
                      key={`${kind}-${r.id}`}
                      last={i === hits.length - 1}
                      onPress={() => open(kind, r.id)}
                      label={r.name}
                      lead={kind === 'player' ? <Avatar name={r.name} image={r.image} /> : <Crest name={r.name} logo={r.image} size={40} />}
                      trail={<Icon name="chevron" size={18} color={c.text3} />}
                    >
                      <Text variant="label" numberOfLines={1}>{r.name}</Text>
                      {r.subtitle ? <Text variant="caption" color="text2" numberOfLines={1}>{r.subtitle}</Text> : null}
                    </Row>
                  ))}
                </Card>
              </Section>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
