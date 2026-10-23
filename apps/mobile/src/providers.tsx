import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiClient, createSportsApi } from '@sports247/api';
import { DataProvider, createQueryClient, type DataConfig } from '@sports247/data';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useMemo, type ReactNode } from 'react';
import { env } from './env';
import { wireQueryManagers } from './lib/misc';

const queryClient = createQueryClient();
wireQueryManagers();

// Offline: the last 24 h of data stays readable after a restart.
const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'sports247.cache', throttleTime: 2000 });

export function AppProviders({ guestId, children }: { guestId: string; children: ReactNode }) {
  const config = useMemo<DataConfig>(() => {
    const client = createApiClient({
      baseUrl: env.apiBaseUrl,
      // Only a production release build may write (game answers) to the production API.
      allowProductionWrites: env.appEnv === 'production' && !__DEV__ && !env.readOnly,
    });
    return { api: createSportsApi(client), livePollMs: env.livePollMs, guestId };
  }, [guestId]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000,
        buster: `${env.apiBaseUrl}|${env.buildId}`,
        dehydrateOptions: { shouldDehydrateQuery: (q) => q.state.status === 'success' && !String(q.queryKey[0]).startsWith('game') },
      }}
    >
      <DataProvider value={config}>{children}</DataProvider>
    </PersistQueryClientProvider>
  );
}
