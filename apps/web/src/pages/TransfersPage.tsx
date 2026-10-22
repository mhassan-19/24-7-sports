import { useTransfers } from '@sports247/data';
import { Link } from 'react-router';
import { usePaths, useFmt } from '../lib/locale';
import { Icon } from '../ui/Icon';
import { Avatar, Badge, Button, H1, List } from '../ui/primitives';
import { EmptyState, ErrorState, Skeleton } from '../ui/states';
import { Seo } from '../ui/Seo';
import p from './pages.module.css';

export default function TransfersPage() {
  const f = useFmt();
  const paths = usePaths();
  const q = useTransfers();
  const items = q.data?.pages.flatMap((pg) => pg.items) ?? [];

  return (
    <div className={`${p.stack} ${p.narrow}`}>
      <Seo title={f.t('seo.transfers')} />
      <div className={p.desktopTitle}>
        <H1 upper>{f.t('transfers.title')}</H1>
      </div>
      {q.isPending ? (
        <Skeleton />
      ) : !q.data ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : !items.length ? (
        <EmptyState message={f.t('transfers.empty')} />
      ) : (
        <>
          <List>
            {items.map((t) => (
              <div key={t.id} className={p.transfer}>
                <Avatar name={t.player.name} image={t.player.image} />
                <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                  <Link to={paths.player(t.player.id)} style={{ fontWeight: 700 }}>
                    <bdi>{t.player.name}</bdi>
                  </Link>
                  <span className={p.route} aria-label={f.t('transfers.route', { from: t.from.name, to: t.to.name })}>
                    <Link to={paths.team(t.from.id)}>
                      <bdi>{t.from.name}</bdi>
                    </Link>
                    <Icon name="arrow" />
                    <Link to={paths.team(t.to.id)} style={{ color: 'var(--text)', fontWeight: 600 }}>
                      <bdi>{t.to.name}</bdi>
                    </Link>
                  </span>
                </div>
                <div style={{ display: 'grid', justifyItems: 'end', gap: 4 }}>
                  {t.fee && (
                    <bdi className={p.fee} dir="ltr">
                      {t.fee}
                    </bdi>
                  )}
                  {t.contract && (
                    <Badge>
                      <bdi>{t.contract}</bdi>
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </List>
          {q.hasNextPage && (
            <div>
              <Button variant="secondary" onClick={() => void q.fetchNextPage()} disabled={q.isFetchingNextPage}>
                {f.t('common.loadMore')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
