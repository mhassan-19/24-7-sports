import { useGalleries, useGalleryImages, useSquad, useTeam, useTeamCalendar, useTeamStats } from '@sports247/data';
import type { Team } from '@sports247/domain';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { MatchList, teamName } from '../../../src/features/match';
import { paths, useFmt } from '../../../src/lib/locale';
import { useSeasonQuery } from '../../../src/lib/misc';
import { useTheme } from '../../../src/lib/theme';
import { Avatar, Card, Chip, Chips, Crest, Eyebrow, Row, Screen, Section, Segmented, Tiles } from '../../../src/ui/primitives';
import { EmptyState, QueryView, Skeleton } from '../../../src/ui/states';
import { Text } from '../../../src/ui/Text';

type Tab = 'matches' | 'squad' | 'stats' | 'photos';

export default function TeamScreen() {
  const f = useFmt();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const team = useTeam(id);
  const galleries = useGalleries(id);
  const [tab, setTab] = useState<Tab>('matches');
  const tabs: Tab[] = ['matches', 'squad', 'stats', ...(galleries.data?.length ? (['photos'] as Tab[]) : [])];

  return (
    <Screen title={team.data ? teamName(team.data, f.lang) : ''} onRefresh={() => team.refetch()}>
      <QueryView query={team} skeleton={<Skeleton rows={4} height={70} />}>
        {(t) => (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Crest name={t.name} shortName={t.shortName} logo={t.logo} size={64} />
              <View style={{ flex: 1, gap: 2 }}>
                {t.shortName && f.lang === 'ar' ? <Eyebrow>{t.shortName}</Eyebrow> : null}
                <Text variant="h1">{teamName(t, f.lang)}</Text>
                {t.manager ? <Text variant="small" color="text2">{`${f.t('match.manager')}: ${t.manager}`}</Text> : null}
              </View>
            </View>
            {t.competitions.length ? (
              <Chips>
                {t.competitions.map((c) => (
                  <Chip key={c.id} onPress={() => router.push(paths.competition(c.id))} lead={<Crest name={c.title} logo={c.logo} size={20} />}>{c.title}</Chip>
                ))}
              </Chips>
            ) : null}
            <Segmented<Tab> value={tab} onChange={setTab} options={tabs.map((x) => ({ value: x, label: f.t(`team.tabs.${x}`) }))} />
            {tab === 'matches' && <MatchesTab id={id} />}
            {tab === 'squad' && <SquadTab id={id} />}
            {tab === 'stats' && <StatsTab team={t} />}
            {tab === 'photos' && <PhotosTab id={id} />}
          </>
        )}
      </QueryView>
    </Screen>
  );
}

function MatchesTab({ id }: { id: number }) {
  const f = useFmt();
  const calendar = useTeamCalendar(id);
  return (
    <QueryView query={calendar}>
      {(d) => (
        <>
          {d.today.length > 0 && <Section title={f.t('common.today')}><MatchList matches={d.today} /></Section>}
          <Section title={f.t('common.next')}>{d.next.length ? <MatchList matches={d.next} /> : <EmptyState message={f.t('team.noUpcoming')} />}</Section>
          {d.previous.length > 0 && <Section title={f.t('common.previous')}><MatchList matches={d.previous} /></Section>}
        </>
      )}
    </QueryView>
  );
}

function SquadTab({ id }: { id: number }) {
  const f = useFmt();
  const squad = useSquad(id);
  return (
    <QueryView query={squad} isEmpty={(d) => !d.length} empty={<EmptyState message={f.t('states.empty')} />}>
      {(groups) => (
        <>
          {groups.map((g) => (
            <Section key={g.position} title={f.t(`team.positions.${g.position}`)}>
              <Card>
                {g.players.map((p, i) => (
                  <Row
                    key={p.id}
                    last={i === g.players.length - 1}
                    onPress={() => router.push(paths.player(p.id))}
                    label={p.name}
                    lead={<Avatar name={p.name} image={p.image} />}
                    trail={<Text variant="num" size={20} weight={800}>{f.n(p.number)}</Text>}
                  >
                    <Text variant="label" numberOfLines={1}>{p.name}</Text>
                    <Text variant="caption" color="text2">
                      {[p.nationality, p.age != null ? `${f.t('player.age')} ${f.n(p.age)}` : null].filter(Boolean).join(' · ')}
                    </Text>
                  </Row>
                ))}
              </Card>
            </Section>
          ))}
        </>
      )}
    </QueryView>
  );
}

function StatsTab({ team }: { team: Team }) {
  const f = useFmt();
  const { c } = useTheme();
  const competitionId = team.mainCompetitionId ?? team.competitions[0]?.id ?? 0;
  const season = useSeasonQuery(competitionId);
  const stats = useTeamStats(team.id, season, competitionId > 0);
  return (
    <QueryView query={stats} isEmpty={(d) => d.played === 0} empty={<EmptyState message={f.t('team.noStats')} />}>
      {(d) => {
        const max = Math.max(1, ...d.byInterval.map((x) => x.goals));
        return (
          <>
            <Tiles
              items={[
                { label: f.t('team.stats.played'), value: f.n(d.played) },
                { label: f.t('team.stats.won'), value: f.n(d.won), accent: true },
                { label: f.t('team.stats.drawn'), value: f.n(d.drawn) },
                { label: f.t('team.stats.lost'), value: f.n(d.lost) },
                { label: f.t('team.stats.goalsFor'), value: f.n(d.goalsFor) },
                { label: f.t('team.stats.goalsAgainst'), value: f.n(d.goalsAgainst) },
                { label: f.t('team.stats.cleanSheets'), value: f.n(d.cleanSheets) },
                { label: f.t('team.stats.yellowCards'), value: f.n(d.yellowCards) },
              ]}
            />
            {d.byInterval.length ? (
              <Card style={{ padding: 16, gap: 12 }}>
                <Text variant="label">{f.t('team.stats.byInterval')}</Text>
                {/* Minutes run left to right like a timeline in both languages. */}
                <View style={{ direction: 'ltr', flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 150 }}>
                  {d.byInterval.map((x) => (
                    <View key={x.label} style={{ flex: 1, alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                      <Text variant="num">{f.n(x.goals)}</Text>
                      <View style={{ width: '70%', height: `${(x.goals / max) * 70}%`, minHeight: 2, borderRadius: 6, backgroundColor: c.accent }} />
                      <Text variant="caption" color="text2">{f.digits(`${x.label}'`)}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}
          </>
        );
      }}
    </QueryView>
  );
}

function PhotosTab({ id }: { id: number }) {
  const f = useFmt();
  const { radius } = useTheme();
  const galleries = useGalleries(id);
  const [open, setOpen] = useState<number | null>(null);
  const images = useGalleryImages(open);
  return (
    <QueryView query={galleries} isEmpty={(d) => !d.length} empty={<EmptyState message={f.t('states.empty')} />}>
      {(list) => (
        <Card>
          {list.slice(0, 30).map((g, i) => (
            <View key={g.id}>
              <Row last={i === Math.min(list.length, 30) - 1 && open !== g.id} onPress={() => setOpen(open === g.id ? null : g.id)} label={g.name} lead={<Avatar name={g.name} image={g.image} size={52} />}>
                <Text variant="label" numberOfLines={2}>{g.name}</Text>
                {open === g.id && images.data ? <Text variant="caption" color="text2">{f.tn('team.photos', images.data.length)}</Text> : null}
              </Row>
              {open === g.id ? (
                images.isPending ? (
                  <Skeleton rows={2} height={120} />
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 10 }}>
                    {(images.data ?? []).map((src) => (
                      <Image key={src} source={{ uri: src }} style={{ width: '48%', aspectRatio: 4 / 3, borderRadius: radius.small }} contentFit="cover" />
                    ))}
                  </View>
                )
              ) : null}
            </View>
          ))}
        </Card>
      )}
    </QueryView>
  );
}
