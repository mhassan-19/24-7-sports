import type { BracketRound, FormResult, Leader, StandingRow } from '@sports247/domain';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { paths, useFmt } from '../lib/locale';
import { useTheme } from '../lib/theme';
import { Card, Crest, Row } from '../ui/primitives';
import { Text } from '../ui/Text';

export function FormChips({ form }: { form: FormResult[] }) {
  const f = useFmt();
  const { c } = useTheme();
  const style = (r: FormResult) =>
    r === 'W' ? { backgroundColor: c.accent } : r === 'L' ? { backgroundColor: c.brand.steel } : { borderWidth: 1, borderColor: c.text3 };
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {form.map((r, i) => (
        <View key={i} accessibilityLabel={r === 'W' ? 'win' : r === 'D' ? 'draw' : 'loss'} style={[{ width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }, style(r)]}>
          <Text variant="num" size={12} style={{ color: r === 'D' ? c.text : c.brand.midnight }}>
            {f.t(`competition.form.${r}`)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const COLS = { pos: 30, team: 168, num: 40, pts: 44, form: 140 };

/** Standings: compact columns first; the full table scrolls sideways on narrow screens. */
export function StandingsTable({ rows, compact }: { rows: StandingRow[]; compact?: boolean }) {
  const f = useFmt();
  const { c } = useTheme();
  const head = (label: string, w: number) => (
    <Text variant="caption" color="text2" align="center" style={{ width: w }}>
      {label}
    </Text>
  );
  const table = (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: c.line }}>
        {head(f.t('competition.table.pos'), COLS.pos)}
        <Text variant="caption" color="text2" style={{ width: COLS.team }}>{f.t('competition.table.team')}</Text>
        {head(f.t('competition.table.played'), COLS.num)}
        {!compact && head(f.t('competition.table.gfga'), COLS.num + 16)}
        {!compact && head(f.t('competition.table.gd'), COLS.num)}
        {head(f.t('competition.table.pts'), COLS.pts)}
        {!compact && head(f.t('competition.table.form'), COLS.form)}
      </View>
      {rows.map((r, i) => {
        const gd = r.goalsFor - r.goalsAgainst;
        return (
          <Pressable
            key={r.team.id}
            onPress={() => router.push(paths.team(r.team.id))}
            accessibilityRole="button"
            accessibilityLabel={`${f.n(r.position)} ${r.team.name} ${f.n(r.points)}`}
            style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingHorizontal: 8, borderBottomWidth: i === rows.length - 1 ? 0 : 1, borderBottomColor: c.line }}
          >
            <Text variant="num" color="text2" align="center" style={{ width: COLS.pos }}>{f.n(r.position)}</Text>
            <View style={{ width: COLS.team, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Crest name={r.team.name} logo={r.team.logo} />
              <Text variant="label" numberOfLines={1} style={{ flexShrink: 1 }}>{r.team.name}</Text>
            </View>
            <Text variant="num" align="center" style={{ width: COLS.num }}>{f.n(r.played)}</Text>
            {!compact && <Text variant="num" align="center" style={{ width: COLS.num + 16 }}>{`${f.n(r.goalsFor)}:${f.n(r.goalsAgainst)}`}</Text>}
            {!compact && <Text variant="num" align="center" style={{ width: COLS.num }}>{`${gd > 0 ? '+' : ''}${f.n(gd)}`}</Text>}
            <Text variant="num" weight={800} size={17} align="center" style={{ width: COLS.pts }}>{f.n(r.points)}</Text>
            {!compact && (
              <View style={{ width: COLS.form, alignItems: 'center' }}>
                <FormChips form={r.form} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
  return <Card>{compact ? table : <ScrollView horizontal showsHorizontalScrollIndicator={false}>{table}</ScrollView>}</Card>;
}

export function LeaderList({ leaders, limit }: { leaders: Leader[]; limit?: number }) {
  const f = useFmt();
  const list = leaders.slice(0, limit ?? leaders.length);
  return (
    <Card>
      {list.map((p, i) => (
        <Row
          key={p.player.id}
          last={i === list.length - 1}
          onPress={() => router.push(paths.player(p.player.id))}
          label={`${p.player.name} ${f.n(p.value)}`}
          lead={<Text variant="num" color="text2" style={{ width: 22 }} align="center">{f.n(i + 1)}</Text>}
          trail={<Text variant="num" size={22} weight={800}>{f.n(p.value)}</Text>}
        >
          <Text variant="label" numberOfLines={1}>{p.player.name}</Text>
          <Text variant="caption" color="text2" numberOfLines={1}>
            {[p.team?.name, p.played != null ? f.tn('competition.played', p.played) : null].filter(Boolean).join(' · ')}
          </Text>
        </Row>
      ))}
    </Card>
  );
}

export function Bracket({ rounds }: { rounds: BracketRound[] }) {
  const f = useFmt();
  const { c, radius } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
      {rounds.map((r) => (
        <View key={r.id} style={{ width: 230, gap: 10 }}>
          <Text variant="label" color="text2">{r.name}</Text>
          {r.matches.map((m) => (
            <Pressable key={m.id} onPress={() => router.push(paths.match(m.id))} style={{ padding: 10, gap: 4, borderRadius: radius.small, backgroundColor: c.surface }}>
              {m.teams.map((t) => (
                <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Crest name={t.name} logo={t.logo} size={22} />
                  <Text variant="small" numberOfLines={1} style={{ flex: 1 }}>{t.name}</Text>
                  <Text variant="num">{`${f.n(t.score)}${t.penalties != null ? ` (${f.n(t.penalties)})` : ''}`}</Text>
                </View>
              ))}
              <Text variant="caption" color="text2">{f.date(m.kickoff)}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
