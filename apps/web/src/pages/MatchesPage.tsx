import { useDayMatches } from '@sports247/data';
import { groupByCompetition, sortMatches } from '@sports247/domain';
import { useSearchParams } from 'react-router';
import { MatchGroups } from '../features/match/MatchRow';
import { useFmt } from '../lib/locale';
import { Button, Chip, Chips, Crest, H1, Segmented } from '../ui/primitives';
import { EmptyState, QueryView } from '../ui/states';
import { Seo } from '../ui/Seo';
import p from './pages.module.css';

type Day = 'yesterday' | 'today' | 'tomorrow';
const DAYS: Day[] = ['yesterday', 'today', 'tomorrow'];

export default function MatchesPage() {
  const f = useFmt();
  const [params, setParams] = useSearchParams();
  const day = (DAYS.includes(params.get('day') as Day) ? params.get('day') : 'today') as Day;
  const competition = params.get('competition');
  const days = useDayMatches();

  const set = (next: { day?: Day; competition?: string | null }) => {
    const sp = new URLSearchParams(params);
    if (next.day) sp.set('day', next.day);
    if (next.competition === null) sp.delete('competition');
    else if (next.competition) sp.set('competition', next.competition);
    setParams(sp, { replace: true });
  };

  return (
    <div className={p.stack}>
      <Seo title={f.t('seo.matches')} />
      <div className={p.desktopTitle}>
        <H1 upper>{f.t('nav.matches')}</H1>
      </div>
      <Segmented<Day>
        label={f.t('nav.matches')}
        value={day}
        onChange={(d) => set({ day: d, competition: null })}
        options={DAYS.map((d) => ({ value: d, label: f.t(`days.${d}`) }))}
      />
      <QueryView query={days} isEmpty={(d) => d[day].length === 0} empty={<EmptyState message={f.t('match.noMatchesDay')} />}>
        {(d) => {
          const list = d[day];
          // One chip per competition playing that day, in the same order as the list below.
          const competitions = groupByCompetition(sortMatches(list))
            .map((g) => g.competition)
            .filter((c): c is NonNullable<typeof c> => c != null);
          const shown = competition ? list.filter((m) => String(m.competition?.id) === competition) : list;
          return (
            <>
              {competitions.length > 1 && (
                <Chips label={f.t('match.filterByCompetition')}>
                  <Chip pressed={!competition} onClick={() => set({ competition: null })}>
                    {f.t('common.all')}
                  </Chip>
                  {competitions.map((c) => (
                    <Chip key={c.id} pressed={competition === String(c.id)} onClick={() => set({ competition: String(c.id) })}>
                      <Crest name={c.title} logo={c.logo} size={20} />
                      <bdi>{c.title}</bdi>
                    </Chip>
                  ))}
                </Chips>
              )}
              <p className="small muted">{f.t('common.cairoTime')}</p>
              {shown.length ? (
                <MatchGroups matches={shown} />
              ) : (
                <EmptyState
                  message={f.t('match.noMatchesCompetition')}
                  action={
                    <Button variant="secondary" onClick={() => set({ competition: null })}>
                      {f.t('match.clearFilter')}
                    </Button>
                  }
                />
              )}
            </>
          );
        }}
      </QueryView>
    </div>
  );
}
