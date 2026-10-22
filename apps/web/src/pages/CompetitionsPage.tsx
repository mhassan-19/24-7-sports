import { useCompetitions, useRegions } from '@sports247/data';
import { FOOTBALL, type Competition } from '@sports247/domain';
import { useSearchParams } from 'react-router';
import { usePaths, useFmt } from '../lib/locale';
import { Icon } from '../ui/Icon';
import { Chip, Chips, Crest, H1, List, Row, Section, ui } from '../ui/primitives';
import { EmptyState, QueryView } from '../ui/states';
import { Seo } from '../ui/Seo';
import c from '../features/competition/competition.module.css';
import p from './pages.module.css';

export default function CompetitionsPage() {
  const f = useFmt();
  const [params, setParams] = useSearchParams();
  const region = params.get('region');
  const q = params.get('q') ?? '';
  const competitions = useCompetitions();
  const regions = useRegions();

  const update = (key: string, value: string | null) => {
    const sp = new URLSearchParams(params);
    if (value) sp.set(key, value);
    else sp.delete(key);
    setParams(sp, { replace: true });
  };

  return (
    <div className={p.stack}>
      <Seo title={f.t('seo.competitions')} />
      <div className={p.desktopTitle}>
        <H1 upper>{f.t('nav.competitions')}</H1>
      </div>
      <label className={ui.field} htmlFor="competition-filter">
        <Icon name="search" />
        <span className="sr-only">{f.t('competition.filter')}</span>
        <input id="competition-filter" type="search" value={q} placeholder={f.t('competition.filter')} onChange={(e) => update('q', e.target.value || null)} />
      </label>
      <QueryView query={competitions}>
        {(all) => {
          const football = all.filter((x) => x.sportId === FOOTBALL);
          const order = (regions.data ?? []).filter((r) => football.some((x) => x.regionId === r.id));
          const filtered = football.filter((x) => !q || x.title.includes(q));
          const groups = order
            .filter((r) => !region || String(r.id) === region)
            .map((r) => ({ region: r, list: filtered.filter((x) => x.regionId === r.id) }))
            .filter((g) => g.list.length);
          const ungrouped = !region ? filtered.filter((x) => !order.some((r) => r.id === x.regionId)) : [];
          return (
            <>
              {order.length > 1 && (
                <Chips label={f.t('competition.regions')}>
                  <Chip pressed={!region} onClick={() => update('region', null)}>
                    {f.t('common.all')}
                  </Chip>
                  {order.map((r) => (
                    <Chip key={r.id} pressed={region === String(r.id)} onClick={() => update('region', String(r.id))}>
                      {f.lang === 'ar' ? r.nameAr : r.nameEn}
                    </Chip>
                  ))}
                </Chips>
              )}
              {!groups.length && !ungrouped.length && <EmptyState message={f.t('competition.noResults')} />}
              {groups.map((g) => (
                <Section key={g.region.id} title={f.lang === 'ar' ? g.region.nameAr : g.region.nameEn}>
                  <CompetitionList list={g.list} />
                </Section>
              ))}
              {ungrouped.length > 0 && (
                <Section title={f.t('competition.other')}>
                  <CompetitionList list={ungrouped} />
                </Section>
              )}
            </>
          );
        }}
      </QueryView>
    </div>
  );

}

function CompetitionList({ list }: { list: Competition[] }) {
  const f = useFmt();
  const paths = usePaths();
  return (
    <List className={c.gridTeams}>
      {list.map((x) => (
        <Row
          key={x.id}
          to={paths.competition(x.id)}
          lead={<Crest name={x.title} logo={x.logo} />}
          trail={<span className="small muted num">{f.digits(x.currentSeason?.title ?? '')}</span>}
        >
          <bdi>{x.title}</bdi>
        </Row>
      ))}
    </List>
  );
}
