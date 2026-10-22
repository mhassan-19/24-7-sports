import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800.css';
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';
import '@fontsource/cairo/800.css';
import './styles/global.css';
import { themeStylesheet } from '@sports247/tokens';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AppProviders } from './app/providers';
import { createRouter } from './app/router';
import { env } from './env';

// Colour tokens come from one TypeScript source shared with the mobile app.
const tokens = document.createElement('style');
tokens.id = 'sports247-tokens';
tokens.textContent = themeStylesheet();
document.head.prepend(tokens);

if (env.sentryDsn) {
  void import('@sentry/react').then((Sentry) =>
    Sentry.init({ dsn: env.sentryDsn, environment: env.appEnv, release: env.version }),
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={createRouter()} />
    </AppProviders>
  </StrictMode>,
);
