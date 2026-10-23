import { ApiError } from '@sports247/api';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFmt } from '../lib/locale';
import { useOnline } from '../lib/misc';
import { useTheme } from '../lib/theme';
import { Icon } from './Icon';
import { Button } from './primitives';
import { Text } from './Text';

function StateBox({ icon, children }: { icon: 'empty' | 'alert'; children: ReactNode }) {
  const { c, radius } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 12, paddingVertical: 36, paddingHorizontal: 20, borderRadius: radius.card, backgroundColor: c.surface }}>
      <Icon name={icon} size={36} color={c.text3} />
      {children}
    </View>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <StateBox icon="empty">
      <Text align="center">{message}</Text>
      {action ? <View style={{ alignSelf: 'center' }}>{action}</View> : null}
    </StateBox>
  );
}

export function ErrorState({ error, onRetry }: { error?: unknown; onRetry?: () => void }) {
  const f = useFmt();
  const notFound = error instanceof ApiError && error.isNotFound;
  return (
    <View accessibilityRole="alert">
      <StateBox icon="alert">
        <Text align="center">{notFound ? f.t('states.notFound') : f.t('states.error')}</Text>
        {onRetry && !notFound ? (
          <View style={{ alignSelf: 'center' }}>
            <Button variant="secondary" onPress={onRetry}>
              {f.t('states.retry')}
            </Button>
          </View>
        ) : null}
      </StateBox>
    </View>
  );
}

/** Placeholder blocks, shown after 300 ms so fast loads don't flicker. */
export function Skeleton({ rows = 5, height = 56 }: { rows?: number; height?: number }) {
  const f = useFmt();
  const { c } = useTheme();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(id);
  }, []);
  return (
    <View accessibilityLabel={f.t('states.loading')} accessibilityState={{ busy: true }} style={{ gap: 10 }}>
      {visible ? (
        Array.from({ length: rows }, (_, i) => <View key={i} style={{ height, borderRadius: 10, backgroundColor: c.surface2 }} />)
      ) : (
        <ActivityIndicator color={c.accent} style={{ opacity: 0 }} />
      )}
    </View>
  );
}

/** Same contract as the website's QueryView: cached data stays visible when a refetch fails. */
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

export function OfflineBanner() {
  const online = useOnline();
  const f = useFmt();
  const { c } = useTheme();
  if (online) return null;
  return (
    <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.line }}>
      <Icon name="offline" size={18} />
      <Text variant="small">{f.t('states.offline')}</Text>
    </View>
  );
}
