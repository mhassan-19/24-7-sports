import { useSearch } from '@sports247/data';
import type { SearchKind } from '@sports247/domain';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { usePaths, useFmt } from '../lib/locale';
import { Icon } from '../ui/Icon';
import { Avatar, Crest, List, Row, Section, ui } from '../ui/primitives';
import { EmptyState, ErrorState, Skeleton } from '../ui/states';
import { Seo } from '../ui/Seo';
import p from './pages.module.css';

const KINDS: SearchKind[] = ['team', 'player', 'competition'];

export default function SearchPage() {
  const f = useFmt();
  const paths = usePaths();
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState(params.get('q') ?? '');
  const [debounced, setDebounced] = useState(input);

  // Follow the URL when it changes from outside (e.g. "See all results" from the header search).
  const urlQ = params.get('q') ?? '';
  useEffect(() => {
    if (urlQ !== input.trim()) {
      setInput(urlQ);
      setDebounced(urlQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQ]);

  // Debounce typing by 300 ms; the query string follows so results are shareable.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(input);
      const sp = new URLSearchParams(params);
      if (input.trim()) sp.set('q', input.trim());
      else sp.delete('q');
      setParams(sp, { replace: true });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const q = useSearch(debounced);
  const term = debounced.trim();
  const link = (kind: SearchKind, id: number) =>
    kind === 'team' ? paths.team(id) : kind === 'player' ? paths.player(id) : paths.competition(id);

  return (
    <div className={`${p.stack} ${p.narrow}`}>
      <Seo title={f.t('seo.search')} />
      <h1 className="sr-only">{f.t('nav.search')}</h1>
      <form role="search" onSubmit={(e) => e.preventDefault()}>
        <label className={ui.field} htmlFor="q">
          <Icon name="search" />
          <span className="sr-only">{f.t('nav.search')}</span>
          {/* eslint-disable-next-line jsx-a11y/no-autofocus -- the page exists to type a query */}
          <input id="q" type="search" autoFocus autoComplete="off" value={input} placeholder={f.t('search.placeholder')} onChange={(e) => setInput(e.target.value)} />
        </label>
      </form>
      <div aria-live="polite">
        {term.length < 2 ? (
          <p className="muted">{f.t('search.hint')}</p>
        ) : q.isPending ? (
          <Skeleton rows={5} />
        ) : !q.data ? (
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        ) : !q.data.length ? (
          <EmptyState message={f.t('search.empty')} />
        ) : (
          <div className={p.stack} style={{ gap: 24 }}>
            {KINDS.map((kind) => {
              const hits = q.data.filter((r) => r.kind === kind);
              if (!hits.length) return null;
              return (
                <Section key={kind} title={f.t(`search.kinds.${kind}`)}>
                  <List>
                    {hits.map((r) => (
                      <Row
                        key={`${kind}-${r.id}`}
                        to={link(kind, r.id)}
                        lead={kind === 'player' ? <Avatar name={r.name} image={r.image} /> : <Crest name={r.name} logo={r.image} size={40} />}
                        trail={<Icon name="chevron" />}
                      >
                        <b>
                          <bdi>{r.name}</bdi>
                        </b>
                        {r.subtitle && (
                          <span className="small muted">
                            <bdi>{r.subtitle}</bdi>
                          </span>
                        )}
                      </Row>
                    ))}
                  </List>
                </Section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
