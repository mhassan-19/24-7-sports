import { useArticle } from '@sports247/data';
import type { Tag } from '@sports247/domain';
import { useParams } from 'react-router';
import { ArticleBody, NewsRow, Thumb, newsStyles as n } from '../features/news/NewsParts';
import { usePaths, useFmt } from '../lib/locale';
import { Breadcrumbs, ChipLink, Chips, H1, Section } from '../ui/primitives';
import { QueryView, Skeleton } from '../ui/states';
import { Seo } from '../ui/Seo';

export default function ArticlePage() {
  const f = useFmt();
  const paths = usePaths();
  const id = Number(useParams().id);
  const article = useArticle(id);

  const tagLink = (t: Tag) =>
    t.kind === 'team' ? paths.team(t.id) : t.kind === 'player' ? paths.player(t.id) : t.kind === 'competition' ? paths.competition(t.id) : null;

  return (
    <QueryView query={article} skeleton={<Skeleton rows={5} height={80} />}>
      {(a) => (
        <article className={n.article}>
          <Seo title={a.title} description={a.lead} />
          <Breadcrumbs label={f.t('nav.breadcrumb')} items={[{ label: f.t('nav.news'), to: paths.news() }, { label: <bdi>{a.title.slice(0, 48)}</bdi> }]} />
          <H1>
            <bdi>{a.title}</bdi>
          </H1>
          <p className="small muted">
            <time dateTime={a.publishedAt}>{f.date(a.publishedAt)}</time> · {f.tn('common.views', a.views)}
          </p>
          {a.image && <Thumb src={a.image} />}
          <ArticleBody html={a.bodyHtml} />
          {a.tags.some((t) => tagLink(t)) && (
            <Chips>
              {a.tags.map((t) => {
                const to = tagLink(t);
                return to ? (
                  <ChipLink key={`${t.kind}-${t.id}`} to={to}>
                    <bdi>{t.title}</bdi>
                  </ChipLink>
                ) : null;
              })}
            </Chips>
          )}
          {a.related.length > 0 && (
            <Section title={f.t('news.related')}>
              <div>
                {a.related.slice(0, 5).map((r) => (
                  <NewsRow key={r.id} item={r} />
                ))}
              </div>
            </Section>
          )}
        </article>
      )}
    </QueryView>
  );
}
