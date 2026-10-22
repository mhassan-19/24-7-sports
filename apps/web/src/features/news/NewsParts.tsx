import type { ArticleSummary } from '@sports247/domain';
import DOMPurify from 'dompurify';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { usePaths, useFmt } from '../../lib/locale';
import { Icon } from '../../ui/Icon';
import s from './news.module.css';

function Thumb({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={s.thumb}>
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <Icon name="image" />
      )}
    </span>
  );
}

export function NewsCard({ item, lead }: { item: ArticleSummary; lead?: boolean }) {
  const f = useFmt();
  const paths = usePaths();
  return (
    <Link className={`${s.card} ${lead ? s.lead : ''}`} to={paths.article(item.id)}>
      <Thumb src={item.image} />
      <span className={s.title}>
        <bdi>{item.title}</bdi>
      </span>
      <span className="small muted">{f.date(item.publishedAt)}</span>
    </Link>
  );
}

export function NewsRow({ item }: { item: ArticleSummary }) {
  const f = useFmt();
  const paths = usePaths();
  return (
    <Link className={s.row} to={paths.article(item.id)}>
      <Thumb src={item.image} />
      <span style={{ display: 'grid', gap: 4, minWidth: 0 }}>
        <span className={s.title}>
          <bdi>{item.title}</bdi>
        </span>
        <span className="small muted">{f.date(item.publishedAt)}</span>
      </span>
    </Link>
  );
}

export const NewsGrid = ({ items }: { items: ArticleSummary[] }) => (
  <div className={s.grid}>
    {items.map((i) => (
      <NewsCard key={i.id} item={i} />
    ))}
  </div>
);

// Links inside articles open outside the app.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/** Article HTML comes from the CMS: sanitised, scripts and inline handlers removed. */
export function ArticleBody({ html }: { html: string }) {
  const clean = useMemo(
    () =>
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'h2', 'h3', 'blockquote', 'a', 'img'],
        ALLOWED_ATTR: ['href', 'src', 'alt'],
      }),
    [html],
  );
  return <div className={s.body} dir="auto" dangerouslySetInnerHTML={{ __html: clean }} />;
}

export { s as newsStyles, Thumb };
