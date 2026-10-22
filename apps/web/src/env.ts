// Typed access to build-time environment (apps/web/.env.*). No code change is needed to switch
// between TEST and PROD: the build mode picks the file.
declare const __BUILD_ID__: string;

const e = import.meta.env;

export const env = {
  appEnv: (e.VITE_APP_ENV === 'production' ? 'production' : 'test') as 'production' | 'test',
  apiBaseUrl: e.VITE_API_BASE_URL || 'https://testv3.appkora.com/api',
  englishEnabled: e.VITE_FEATURE_ENGLISH === 'true',
  livePollMs: Number(e.VITE_LIVE_POLL_MS) || 30000,
  siteUrl: (e.VITE_SITE_URL || '').replace(/\/+$/, ''),
  sentryDsn: e.VITE_SENTRY_DSN || '',
  version: '0.1.0',
  buildId: __BUILD_ID__,
};
