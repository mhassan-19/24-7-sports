import { ApiError } from '@sports247/api';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './primitives';
import { Icon } from './Icon';
import s from './ui.module.css';

export function EmptyState({ message, action, heading }: { message: string; action?: ReactNode; heading?: boolean }) {
  return (
    <div className={s.state}>
      <Icon name="empty" />
      {heading ? <h1 className="small" style={{ fontSize: 18 }}>{message}</h1> : <p>{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ onRetry, error }: { onRetry?: () => void; error?: unknown }) {
  const { t } = useTranslation();
  const notFound = error instanceof ApiError && error.isNotFound;
  return (
    <div className={s.state} role="alert">
      <Icon name="alert" />
      <p>{notFound ? t('states.notFound') : t('states.error')}</p>
      {onRetry && !notFound && (
        <Button variant="secondary" onClick={onRetry}>
          {t('states.retry')}
        </Button>
      )}
    </div>
  );
}

/** Skeleton shown only after 300 ms so fast responses don't flicker. */
export function Skeleton({ rows = 6, height = 56 }: { rows?: number; height?: number }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className={s.section} aria-busy="true" aria-live="polite">
      <span className="sr-only">{t('states.loading')}</span>
      {visible &&
        Array.from({ length: rows }, (_, i) => <div key={i} className={s.skeleton} style={{ blockSize: height }} />)}
    </div>
  );
}

/**
 * Standard loading / error / empty handling for one query. Cached data stays visible while a
 * background refetch fails (offline), so users keep reading saved data.
 */
export function QueryView<T>({
  query,
  isEmpty,
  empty,
  skeleton,
  children,
}: {
  query: { data: T | undefined; error: unknown; isPending: boolean; refetch: () => unknown };
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  skeleton?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) return <>{skeleton ?? <Skeleton />}</>;
  if (query.data === undefined) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (isEmpty?.(query.data)) return <>{empty}</>;
  return <>{children(query.data)}</>;
}
