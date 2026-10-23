// Web APIs the shared packages rely on that React Native / Hermes lacks or only partly implements.
// Imported first, before anything that builds URLs or plural forms.

// URL.searchParams.set and URLSearchParams.toString (packages/api builds every request with them).
import 'react-native-url-polyfill/auto';

// Intl.PluralRules for i18next plurals (Arabic has six forms). Each polyfill only installs itself
// when the engine lacks the feature.
import '@formatjs/intl-getcanonicallocales/polyfill';
import '@formatjs/intl-locale/polyfill';
import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/locale-data/ar';
import '@formatjs/intl-pluralrules/locale-data/en';
