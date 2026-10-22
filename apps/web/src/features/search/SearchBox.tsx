import { useSearch } from '@sports247/data';
import type { SearchKind, SearchResult } from '@sports247/domain';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router';
import { usePaths, useFmt } from '../../lib/locale';
import { Icon } from '../../ui/Icon';
import { Avatar, Crest } from '../../ui/primitives';
import s from './search.module.css';

const KINDS: SearchKind[] = ['team', 'player', 'competition'];
const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

type Option = { id: string; to: string; result?: SearchResult };

/**
 * Search as you type (WAI-ARIA combobox). `inline` is the desktop header field with a dropdown;
 * `sheet` fills the phone search overlay. Enter on the field opens the full results page.
 */
export function SearchBox({
  variant,
  onDone,
  focusOnOpen,
  leading,
}: {
  variant: 'inline' | 'sheet';
  onDone?: () => void;
  /** Focus the field when it mounts (the phone sheet opens to type). */
  focusOnOpen?: boolean;
  /** Sheet only: control placed before the field (the close button). */
  leading?: ReactNode;
}) {
  const f = useFmt();
  const paths = usePaths();
  const navigate = useNavigate();
  const location = useLocation();
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(variant === 'sheet');
  const [active, setActive] = useState(-1);
  const term = useDebounced(value.trim(), DEBOUNCE_MS);
  const query = useSearch(term);
  const perKind = variant === 'inline' ? 4 : 8;

  const link = (r: SearchResult) =>
    r.kind === 'team' ? paths.team(r.id) : r.kind === 'player' ? paths.player(r.id) : paths.competition(r.id);

  const groups = useMemo(
    () =>
      KINDS.map((kind) => ({ kind, items: (query.data ?? []).filter((r) => r.kind === kind).slice(0, perKind) })).filter(
        (g) => g.items.length > 0,
      ),
    [query.data, perKind],
  );

  // Flat option list for keyboard navigation; the last option opens the full results page.
  const options: Option[] = useMemo(() => {
    const list: Option[] = groups.flatMap((g) => g.items.map((r) => ({ id: `${listId}-${r.kind}-${r.id}`, to: link(r), result: r })));
    if (term.length >= MIN_CHARS && list.length) list.push({ id: `${listId}-all`, to: paths.search(term) });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, term, listId, paths]);

  useEffect(() => setActive(-1), [term]);

  // Close the inline dropdown when the route changes or the user clicks elsewhere.
  useEffect(() => {
    if (variant === 'inline') setOpen(false);
  }, [location.pathname, variant]);
  useEffect(() => {
    if (variant !== 'inline') return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [variant]);

  const go = (to: string) => {
    setValue('');
    setOpen(variant === 'sheet');
    inputRef.current?.blur();
    navigate(to);
    onDone?.();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && options.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp' && options.length) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && options[active]) go(options[active].to);
      else if (value.trim().length >= MIN_CHARS) go(paths.search(value.trim()));
    } else if (e.key === 'Escape') {
      if (variant === 'sheet') onDone?.();
      else if (open) setOpen(false);
      else setValue('');
    }
  };

  const typing = value.trim() !== term; // waiting for the debounce
  const showPanel = variant === 'sheet' || (open && value.trim().length > 0);
  const count = query.data?.length ?? 0;

  const body = (
    <>
      <p className="sr-only" aria-live="polite">
        {term.length >= MIN_CHARS && query.data ? f.tn('search.results', count) : ''}
      </p>
      {value.trim().length < MIN_CHARS ? (
        <p className={s.note}>{f.t('search.hint')}</p>
      ) : typing || query.isFetching ? (
        <p className={s.note}>{f.t('search.searching')}</p>
      ) : query.isError && !query.data ? (
        <p className={s.note} role="alert">
          {f.t('states.error')}
        </p>
      ) : !count ? (
        <p className={s.note}>{f.t('search.empty')}</p>
      ) : (
        <div role="listbox" id={listId} aria-label={f.t('nav.search')} className={s.results}>
          {groups.map((g) => (
            <div key={g.kind} role="group" aria-labelledby={`${listId}-${g.kind}`}>
              <div id={`${listId}-${g.kind}`} role="presentation" className={s.groupLabel}>
                {f.t(`search.kinds.${g.kind}`)}
              </div>
              {g.items.map((r) => {
                const o = options.findIndex((x) => x.result === r);
                return (
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keys are handled on the combobox input (aria-activedescendant)
                  <div
                    key={`${r.kind}-${r.id}`}
                    id={options[o]?.id}
                    role="option"
                    tabIndex={-1}
                    aria-selected={active === o}
                    className={s.option}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(o)}
                    onClick={() => go(link(r))}
                  >
                    {r.kind === 'player' ? <Avatar name={r.name} image={r.image} size={36} /> : <Crest name={r.name} logo={r.image} size={36} />}
                    <span className={s.optionText}>
                      <b>
                        <bdi>{r.name}</bdi>
                      </b>
                      {r.subtitle && (
                        <span className="small muted">
                          <bdi>{r.subtitle}</bdi>
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keys are handled on the combobox input */}
          <div
            id={`${listId}-all`}
            role="option"
            tabIndex={-1}
            aria-selected={active === options.length - 1}
            className={s.seeAll}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActive(options.length - 1)}
            onClick={() => go(paths.search(term))}
          >
            {f.t('search.seeAll')}
          </div>
        </div>
      )}
    </>
  );

  const field = (
    <div className={s.field}>
      <Icon name="search" />
      <label htmlFor={`${listId}-input`} className="sr-only">
        {f.t('nav.search')}
      </label>
      <input
        ref={inputRef}
        id={`${listId}-input`}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showPanel && count > 0}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? options[active]?.id : undefined}
        autoComplete="off"
        enterKeyHint="search"
        // eslint-disable-next-line jsx-a11y/no-autofocus -- the phone sheet opens to type a query
        autoFocus={focusOnOpen}
        placeholder={f.t('search.placeholder')}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {value && (
        <button
          type="button"
          className={s.clear}
          aria-label={f.t('common.clear')}
          onClick={() => {
            setValue('');
            inputRef.current?.focus();
          }}
        >
          <Icon name="close" />
        </button>
      )}
    </div>
  );

  if (variant === 'sheet') {
    return (
      <>
        <div className={s.sheetHead}>
          {leading}
          <div ref={boxRef} className={s.box} role="search">
            {field}
          </div>
        </div>
        <div className={s.sheetBody}>{body}</div>
      </>
    );
  }
  return (
    <div ref={boxRef} className={`${s.box} ${s.inline}`} role="search">
      {field}
      {showPanel && <div className={s.panel}>{body}</div>}
    </div>
  );
}

/**
 * Phone search: a full-screen dialog over the current page. Escape or the back arrow closes it.
 * Rendered into <body> so the sticky header's stacking context can't put the tab bar on top.
 */
export function SearchSheet({ onClose }: { onClose: () => void }) {
  const f = useFmt();
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return createPortal(
    <div className={s.sheet} role="dialog" aria-modal="true" aria-label={f.t('nav.search')}>
      <SearchBox
        variant="sheet"
        focusOnOpen
        onDone={onClose}
        leading={
          <button type="button" className={s.iconBtn} onClick={onClose} aria-label={f.t('common.close')}>
            <Icon name="back" />
          </button>
        }
      />
    </div>,
    document.body,
  );
}
