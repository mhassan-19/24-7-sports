import { useDayMatches } from '@sports247/data';
import { groupByCompetition, sortMatches } from '@sports247/domain';
import { useState } from 'react';
import { MatchGroups } from '../../src/features/match';
import { useFmt } from '../../src/lib/locale';
import { Button, Chip, Chips, Crest, Screen, Segmented } from '../../src/ui/primitives';
import { EmptyState, QueryView } from '../../src/ui/states';
import { Text } from '../../src/ui/Text';

type Day = 'yesterday' | 'today' | 'tomorrow';

export default function Matches() {
  const f = useFmt();
  const [day, setDay] = useState<Day>('today');
  const [competition, setCompetition] = useState<number | null>(null);
  const days = useDayMatches();

  return (
    <Screen top title={f.t('nav.matches')} onRefresh={() => days.refetch()}>
      <Segmented<Day>
        value={day}
        onChange={(d) => {
          setDay(d);
          setCompetition(null);
        }}
        options={(['yesterday', 'today', 'tomorrow'] as Day[]).map((d) => ({ value: d, label: f.t(`days.${d}`) }))}
      />
      <QueryView query={days} isEmpty={(d) => d[day].length === 0} empty={<EmptyState message={f.t('match.noMatchesDay')} />}>
        {(d) => {
          const list = d[day];
          // One chip per competition playing that day, in the same order as the list.
          const comps = groupByCompetition(sortMatches(list)).map((g) => g.competition).filter((c): c is NonNullable<typeof c> => c != null);
          const shown = competition ? list.filter((m) => m.competition?.id === competition) : list;
          return (
            <>
              {comps.length > 1 ? (
                <Chips>
                  <Chip pressed={competition == null} onPress={() => setCompetition(null)}>{f.t('common.all')}</Chip>
                  {comps.map((c) => (
                    <Chip key={c.id} pressed={competition === c.id} onPress={() => setCompetition(c.id)} lead={<Crest name={c.title} logo={c.logo} size={20} />}>
                      {c.title}
                    </Chip>
                  ))}
                </Chips>
              ) : null}
              <Text variant="caption" color="text2">{f.t('common.cairoTime')}</Text>
              {shown.length ? (
                <MatchGroups matches={shown} />
              ) : (
                <EmptyState message={f.t('match.noMatchesCompetition')} action={<Button variant="secondary" onPress={() => setCompetition(null)}>{f.t('match.clearFilter')}</Button>} />
              )}
            </>
          );
        }}
      </QueryView>
    </Screen>
  );
}
