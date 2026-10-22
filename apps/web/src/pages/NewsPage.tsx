import { useNews } from '@sports247/data';
import { NewsCard, NewsGrid } from '../features/news/NewsParts';
import { useFmt } from '../lib/locale';
import { Button, H1 } from '../ui/primitives';
import { EmptyState, ErrorState, Skeleton } from '../ui/states';
import { Seo } from '../ui/Seo';
import p from './pages.module.css';

export default function NewsPage() {
  const f = useFmt();
  const q = useNews();
  const items = q.data?.pages.flatMap((pg) => pg.items) ?? [];
  const [lead, ...rest] = items;

  return (
    <div className={p.stack} style={{ gap: 24 }}>
      <Seo title={f.t('seo.news')} />
      <div className={p.desktopTitle}>
        <H1 upper>{f.t('news.title')}</H1>
      </div>
      {q.isPending ? (
        <Skeleton rows={4} height={120} />
      ) : !q.data ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : !lead ? (
        <EmptyState message={f.t('news.empty')} />
      ) : (
        <>
          <div className={p.two}>
            <NewsCard item={lead} lead />
          </div>
          <NewsGrid items={rest} />
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
