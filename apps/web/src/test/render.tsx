import type { SportsApi } from '@sports247/api';
import { DataProvider } from '@sports247/data';
import type { Lang } from '@sports247/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { LocaleProvider } from '../lib/locale';

/**
 * Renders a component with the app's providers. `api` is a partial fake: tests never call the
 * real API.
 */
export function renderWithApp(
  ui: ReactElement,
  { lang = 'ar', api = {}, path = `/${lang}/x`, route = '/:lang/*' }: { lang?: Lang; api?: Partial<SportsApi>; path?: string; route?: string } = {},
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DataProvider value={{ api: api as SportsApi, livePollMs: 30000, guestId: 'test-guest' }}>
        <MemoryRouter initialEntries={[path]}>
          <LocaleProvider lang={lang}>
            <Routes>
              <Route path={route} element={ui} />
            </Routes>
          </LocaleProvider>
        </MemoryRouter>
      </DataProvider>
    </QueryClientProvider>,
  );
}
