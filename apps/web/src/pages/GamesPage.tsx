import { useGames } from '@sports247/data';
import { Link } from 'react-router';
import { usePaths, useFmt } from '../lib/locale';
import { Icon } from '../ui/Icon';
import { Badge, H1 } from '../ui/primitives';
import { EmptyState, QueryView } from '../ui/states';
import { Seo } from '../ui/Seo';
import p from './pages.module.css';

export default function GamesPage() {
  const f = useFmt();
  const paths = usePaths();
  const games = useGames();
  return (
    <div className={p.stack}>
      <Seo title={f.t('seo.games')} />
      <div className={p.desktopTitle}>
        <H1 upper>{f.t('games.title')}</H1>
      </div>
      <QueryView query={games} isEmpty={(d) => !d.length} empty={<EmptyState message={f.t('games.empty')} />}>
        {(list) => (
          <div className={p.gameGrid}>
            {list.map((g) => (
              <Link key={g.id} to={paths.game(g.id)} className={p.gameCard}>
                <span className={p.gameImage}>{g.image ? <img src={g.image} alt="" loading="lazy" /> : <Icon name="games" />}</span>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <b style={{ fontSize: 17 }}>
                    <bdi>{g.title}</bdi>
                  </b>
                  <Badge accent={g.type === 'match_predict'}>{f.t(`games.types.${g.type}`)}</Badge>
                </span>
                <span className="small muted">{g.played ? f.t('games.played') : f.t('games.play')}</span>
              </Link>
            ))}
          </div>
        )}
      </QueryView>
    </div>
  );
}
