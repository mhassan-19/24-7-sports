import type { ExpoConfig } from 'expo/config';

// Build-time settings come from EXPO_PUBLIC_* variables: .env.development (TEST) for `expo start`
// and debug builds, .env.production (PROD) for release builds, and eas.json for cloud builds.
const config: ExpoConfig = {
  name: '24/7 Sports',
  slug: 'sports247',
  scheme: 'sports247',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  backgroundColor: '#141416',
  android: {
    package: 'com.sports247.app',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      monochromeImage: './assets/adaptive-icon-mono.png',
      backgroundColor: '#141416',
    },
    // Only the network is needed: no location, camera, microphone or storage.
    permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
    ],
  },
  ios: {
    bundleIdentifier: 'com.sports247.app',
    supportsTablet: false,
  },
  plugins: [
    './plugins/withReleaseSigning',
    './plugins/withShortNativePaths',
    'expo-router',
    'expo-localization',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-logo.png',
        imageWidth: 160,
        backgroundColor: '#141416',
        resizeMode: 'contain',
      },
    ],
  ],
  extra: {
    // New on every build (the config is embedded at build time): resets the persisted query cache
    // so cached data from an older build's mappers is never shown.
    buildId: new Date().toISOString(),
    // Arabic-first app: production (English off) starts in RTL natively from the first frame,
    // whatever the device language. Builds with English on switch direction in JS instead.
    supportsRTL: true,
    forcesRTL: process.env.EXPO_PUBLIC_FEATURE_ENGLISH !== 'true',
  },
  experiments: { typedRoutes: false },
};

export default config;
