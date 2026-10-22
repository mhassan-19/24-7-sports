import { useCompetition, useTopList } from '@sports247/data';
import { Navigate, useParams, useSearchParams } from 'react-router';
import { LeaderList } from '../features/competition/CompetitionParts';
import { usePaths, useFmt } from '../lib/locale';
import { useSeasonQuery } from '../lib/season';
import { Breadcrumbs, H1 } from '../ui/primitives';
import { EmptyState, QueryView } from '../ui/states';
import { Seo } from '../ui/Seo';
import p from './pages.module.css';

export default function LeadersPage() {
  const f = useFmt();
  const paths = usePaths();
  const params = useParams();
  const [search] = useSearchParams();
  const id = Number(params.id);
  const kind = params.kind === 'assists' ? 'assists' : params.kind === 'scorers' ? 'scorers' : null;
  const competition = useCompetition(id);
  const season = useSeasonQuery(id, search.get('season'));
  const list = useTopList(season, kind ?? 'scorers');

  if (!kind) return <Navigate to={paths.competition(id)} replace />;
  const title = f.t(kind === 'scorers' ? 'competition.leaders.topScorers' : 'competition.leaders.topAssists');

  return (
    <div className={`${p.stack} ${p.narrow}`}>
      <Seo title={`${title} · ${competition.data?.title ?? ''}`} />
      <Breadcrumbs
        label={f.t('nav.breadcrumb')}
        items={[
          { label: f.t('nav.competitions'), to: paths.competitions() },
          { label: <bdi>{competition.data?.title ?? ''}</bdi>, to: paths.competition(id, 'stats') },
          { label: title },
        ]}
      />
      <H1 upper>{title}</H1>
      <QueryView query={list} isEmpty={(d) => !d.length} empty={<EmptyState message={f.t('states.empty')} />}>
        {(d) => <LeaderList leaders={d} />}
      </QueryView>
    </div>
  );
}
