import { createApiClient, createSportsApi } from '@sports247/api';
import { DataProvider, createQueryClient, type DataConfig } from '@sports247/data';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useMemo, type ReactNode } from 'react';
import { env } from '../env';
import { getGuestId } from '../lib/guestId';

const queryClient = createQueryClient();

// Offline: keep the last 24 h of data readable after a reload.
const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'sports247.cache',
  throttleTime: 2000,
});

onlineManager.setEventListener((setOnline) => {
  const on = () => setOnline(true);
  const off = () => setOnline(false);
  window.addEventListener('online', on);
  window.addEventListener('offline', off);
  return () => {
    window.removeEventListener('online', on);
    window.removeEventListener('offline', off);
  };
});

export function AppProviders({ children }: { children: ReactNode }) {
  const config = useMemo<DataConfig>(() => {
    const client = createApiClient({
      baseUrl: env.apiBaseUrl,
      // Only a production build may write to the production API.
      allowProductionWrites: env.appEnv === 'production' && import.meta.env.PROD,
    });
    return { api: createSportsApi(client), livePollMs: env.livePollMs, guestId: getGuestId() };
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000,
        // Bust the cache when the API host changes (TEST ↔ PROD) or the app is rebuilt.
        buster: `${env.apiBaseUrl}|${env.buildId}`,
        dehydrateOptions: { shouldDehydrateQuery: (q) => q.state.status === 'success' && !String(q.queryKey[0]).startsWith('game') },
      }}
    >
      <DataProvider value={config}>{children}</DataProvider>
    </PersistQueryClientProvider>
  );
}
