import { useCompetitions, useRegions } from '@sports247/data';
import { FOOTBALL } from '@sports247/domain';
import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { paths, useFmt } from '../../src/lib/locale';
import { useTheme } from '../../src/lib/theme';
import { Icon } from '../../src/ui/Icon';
import { Card, Chip, Chips, Crest, Row, Screen, Section } from '../../src/ui/primitives';
import { EmptyState, QueryView } from '../../src/ui/states';
import { Text } from '../../src/ui/Text';

export default function Competitions() {
  const f = useFmt();
  const { c } = useTheme();
  const [region, setRegion] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const competitions = useCompetitions();
  const regions = useRegions();

  return (
    <Screen top title={f.t('nav.competitions')} onRefresh={() => competitions.refetch()}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14, borderRadius: 12, backgroundColor: c.surface2 }}>
        <Icon name="search" color={c.text3} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={f.t('competition.filter')}
          placeholderTextColor={c.text3}
          accessibilityLabel={f.t('competition.filter')}
          style={{ flex: 1, color: c.text, fontFamily: f.lang === 'ar' ? 'Cairo_400Regular' : 'Barlow_400Regular', fontSize: 16, textAlign: f.rtl ? 'right' : 'left' }}
        />
      </View>
      <QueryView query={competitions}>
        {(all) => {
          const football = all.filter((x) => x.sportId === FOOTBALL && (!q || x.title.includes(q)));
          const order = (regions.data ?? []).filter((r) => all.some((x) => x.regionId === r.id && x.sportId === FOOTBALL));
          const groups = order
            .filter((r) => region == null || r.id === region)
            .map((r) => ({ id: r.id, name: f.lang === 'ar' ? r.nameAr : r.nameEn, list: football.filter((x) => x.regionId === r.id) }))
            .filter((g) => g.list.length);
          const other = region == null ? football.filter((x) => !order.some((r) => r.id === x.regionId)) : [];
          if (!groups.length && !other.length) return <EmptyState message={f.t('competition.noResults')} />;
          return (
            <>
              {order.length > 1 ? (
                <Chips>
                  <Chip pressed={region == null} onPress={() => setRegion(null)}>{f.t('common.all')}</Chip>
                  {order.map((r) => (
                    <Chip key={r.id} pressed={region === r.id} onPress={() => setRegion(r.id)}>{f.lang === 'ar' ? r.nameAr : r.nameEn}</Chip>
                  ))}
                </Chips>
              ) : null}
              {[...groups, ...(other.length ? [{ id: 0, name: f.t('competition.other'), list: other }] : [])].map((g) => (
                <Section key={g.id} title={g.name}>
                  <Card>
                    {g.list.map((x, i) => (
                      <Row
                        key={x.id}
                        last={i === g.list.length - 1}
                        onPress={() => router.push(paths.competition(x.id))}
                        label={x.title}
                        lead={<Crest name={x.title} logo={x.logo} />}
                        trail={<Text variant="caption" color="text2">{f.digits(x.currentSeason?.title ?? '')}</Text>}
                      >
                        <Text variant="label" numberOfLines={1}>{x.title}</Text>
                      </Row>
                    ))}
                  </Card>
                </Section>
              ))}
            </>
          );
        }}
      </QueryView>
    </Screen>
  );
}
