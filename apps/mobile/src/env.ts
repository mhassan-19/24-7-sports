import Constants from 'expo-constants';

// Build-time settings from EXPO_PUBLIC_* (apps/mobile/.env.* and eas.json profiles).
// Switching TEST ↔ PROD is configuration only.
export const env = {
  appEnv: (process.env.EXPO_PUBLIC_APP_ENV === 'production' ? 'production' : 'test') as 'production' | 'test',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://testv3.appkora.com/api',
  englishEnabled: process.env.EXPO_PUBLIC_FEATURE_ENGLISH === 'true',
  /** Real data without writes: test builds pointed at PROD (game answers are refused). */
  readOnly: process.env.EXPO_PUBLIC_READ_ONLY === 'true',
  livePollMs: Number(process.env.EXPO_PUBLIC_LIVE_POLL_MS) || 30000,
  version: '0.1.0',
  buildId: String(Constants.expoConfig?.extra?.buildId ?? '0.1.0'),
};
