import { jest } from '@jest/globals';

// Native modules the app reaches through JS: in-memory or no-op stand-ins for unit tests.
jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-native-community/netinfo', () => jest.requireActual('@react-native-community/netinfo/jest/netinfo-mock.js'));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => false },
  useLocalSearchParams: () => ({}),
}));
