import { useCareer, usePlayer, usePlayerStats } from '@sports247/data';
import type { Player } from '@sports247/domain';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { paths, useFmt } from '../../../src/lib/locale';
import { useTheme } from '../../../src/lib/theme';
import { Avatar, Card, Chip, Chips, Crest, Eyebrow, KeyValues, Row, Screen, Segmented, Tiles } from '../../../src/ui/primitives';
import { EmptyState, QueryView, Skeleton } from '../../../src/ui/states';
import { Text } from '../../../src/ui/Text';

export default function PlayerScreen() {
  const f = useFmt();
  const { c } = useTheme();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const player = usePlayer(id);
  const [tab, setTab] = useState<'stats' | 'career'>('stats');
  return (
    <Screen title={player.data?.name ?? ''} onRefresh={() => player.refetch()}>
      <QueryView query={player} skeleton={<Skeleton rows={4} height={70} />}>
        {(p) => (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              {p.image ? (
                <View>
                  <Avatar name={p.name} image={p.image} size={80} />
                  {p.shirtNumber != null ? (
                    <View
                      accessibilityLabel={`${f.t('player.shirt')} ${p.shirtNumber}`}
                      style={{ position: 'absolute', bottom: -2, left: -4, minWidth: 30, height: 30, paddingHorizontal: 6, borderRadius: 15, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text variant="num" size={15} weight={800} color="onAccent">{f.n(p.shirtNumber)}</Text>
                    </View>
                  ) : null}
                </View>
              ) : p.shirtNumber != null ? (
                <Text variant="num" size={60} weight={800} color="accentText" accessibilityLabel={`${f.t('player.shirt')} ${p.shirtNumber}`}>{f.n(p.shirtNumber)}</Text>
              ) : (
                <Avatar name={p.name} image={null} size={64} />
              )}
              <View style={{ flex: 1, gap: 2 }}>
                {p.position ? <Eyebrow>{p.position}</Eyebrow> : null}
                <Text variant="h1">{p.name}</Text>
              </View>
            </View>
            <KeyValues
              items={[
                { label: f.t('player.nationality'), value: p.nationality ?? '–' },
                { label: f.t('player.age'), value: f.n(p.age) },
                { label: f.t('player.height'), value: p.height ? f.t('player.cm', { value: f.n(p.height) }) : '–' },
                { label: f.t('player.weight'), value: p.weight ? f.t('player.kg', { value: f.n(p.weight) }) : '–' },
              ]}
            />
            <Segmented value={tab} onChange={setTab} options={[{ value: 'stats', label: f.t('player.tabs.stats') }, { value: 'career', label: f.t('player.tabs.career') }]} />
            {tab === 'stats' ? <StatsTab player={p} /> : <CareerTab id={id} />}
          </>
        )}
      </QueryView>
    </Screen>
  );
}

function StatsTab({ player }: { player: Player }) {
  const f = useFmt();
  // Newest season of the player's first (main) competition first, as on the website.
  const main = player.competitions[0];
  const newest = main?.seasons.reduce((a, b) => (b.id > a.id ? b : a), main.seasons[0]!);
  const [choice, setChoice] = useState(main && newest ? `${main.id}:${newest.id}` : '');
  const [competitionId, seasonId] = choice.split(':').map(Number);
  const stats = usePlayerStats(player.id, competitionId && seasonId ? { competitionId, seasonId } : null);
  if (!main) return <EmptyState message={f.t('player.noStats')} />;
  return (
    <>
      <Chips>
        {player.competitions.flatMap((c) =>
          c.seasons.map((s) => {
            const v = `${c.id}:${s.id}`;
            return <Chip key={v} pressed={choice === v} onPress={() => setChoice(v)}>{`${c.name} · ${f.digits(s.title)}`}</Chip>;
          }),
        )}
      </Chips>
      <QueryView query={stats} isEmpty={(d) => d.matches === 0 && d.goals === 0} empty={<EmptyState message={f.t('player.noStats')} />}>
        {(d) => (
          <Tiles
            items={[
              ...(d.rating != null ? [{ label: f.t('player.stats.rating'), value: f.n(d.rating), accent: true }] : []),
              { label: f.t('player.stats.goals'), value: f.n(d.goals) },
              { label: f.t('player.stats.assists'), value: f.n(d.assists) },
              { label: f.t('player.stats.matches'), value: f.n(d.matches) },
              { label: f.t('player.stats.minutes'), value: f.n(d.minutes) },
              ...(d.passAccuracy != null ? [{ label: f.t('player.stats.passAccuracy'), value: f.n(d.passAccuracy, { maximumFractionDigits: 1 }) }] : []),
              { label: f.t('player.stats.attempts'), value: f.n(d.attempts) },
              { label: f.t('player.stats.ballWins'), value: f.n(d.ballWins) },
            ]}
          />
        )}
      </QueryView>
    </>
  );
}

function CareerTab({ id }: { id: number }) {
  const f = useFmt();
  const career = useCareer(id);
  return (
    <QueryView query={career} isEmpty={(d) => !d.length} empty={<EmptyState message={f.t('states.empty')} />}>
      {(d) => (
        <Card>
          {d.map((c, i) => (
            <Row key={`${c.teamId}-${i}`} last={i === d.length - 1} onPress={() => router.push(paths.team(c.teamId))} lead={<Crest name="" logo={c.teamLogo} size={40} />}>
              {c.competitions.map((x) => (
                <Text key={x.id} variant="small">{`${x.title} · ${f.tn('player.goalsIn', x.goals)}`}</Text>
              ))}
            </Row>
          ))}
        </Card>
      )}
    </QueryView>
  );
}
