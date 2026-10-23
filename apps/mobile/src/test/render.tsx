import type { Lang } from '@sports247/i18n';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { LocaleProvider } from '../lib/locale';

/** Renders inside the app's locale context (Arabic by default, as in production). */
export function renderWithApp(ui: ReactElement, { lang = 'ar' }: { lang?: Lang } = {}) {
  return render(<LocaleProvider lang={lang}>{ui}</LocaleProvider>);
}
