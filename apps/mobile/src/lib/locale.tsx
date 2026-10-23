import {
  DATE,
  DATE_TIME,
  DAY,
  TIME,
  createI18n,
  dirOf,
  formatEgyptDateTime,
  formatInstantInCairo,
  formatNumber,
  localizeDigits,
  type Lang,
} from '@sports247/i18n';
import type { i18n as I18n } from 'i18next';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { DevSettings, I18nManager } from 'react-native';
import { env } from '../env';

const LangContext = createContext<Lang>('ar');
const instances: Partial<Record<Lang, I18n>> = {};
const i18nFor = (lang: Lang) => (instances[lang] ??= createI18n(lang));

/** The language the app may use: English only when the build enables it. */
export const effectiveLang = (lang: Lang): Lang => (lang === 'en' && env.englishEnabled ? 'en' : 'ar');

/**
 * React Native fixes layout direction at startup. If the saved language needs the other
 * direction, flip it and reload (development builds; production is Arabic-only and starts RTL
 * natively via `forcesRTL`).
 */
export function syncDirection(lang: Lang) {
  const rtl = dirOf(lang) === 'rtl';
  if (I18nManager.isRTL === rtl) return;
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(rtl);
  if (__DEV__) DevSettings.reload();
}

export function LocaleProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return (
    <LangContext.Provider value={lang}>
      <I18nextProvider i18n={i18nFor(lang)}>{children}</I18nextProvider>
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);

/** Translation plus formatters bound to the current language (same API as the website). */
export function useFmt() {
  const lang = useLang();
  const { t } = useTranslation();
  return useMemo(
    () => ({
      lang,
      t,
      rtl: dirOf(lang) === 'rtl',
      n: (v: number | null | undefined, opts?: Intl.NumberFormatOptions) => formatNumber(v, lang, opts),
      tn: (key: string, count: number, extra?: Record<string, unknown>) =>
        t(key, { count, n: formatNumber(count, lang), ...extra }),
      digits: (v: string | number | null | undefined) => localizeDigits(v, lang),
      time: (wall: string) => formatEgyptDateTime(wall, lang, TIME),
      day: (wall: string) => formatEgyptDateTime(wall, lang, DAY),
      date: (wall: string) => formatEgyptDateTime(wall, lang, DATE),
      dateTime: (wall: string) => formatEgyptDateTime(wall, lang, DATE_TIME),
      instant: (iso: string) => formatInstantInCairo(iso, lang, DATE_TIME),
    }),
    [lang, t],
  );
}

export type Fmt = ReturnType<typeof useFmt>;

/** Routes mirror the website under /football so more sports can be added. */
export const paths = {
  home: () => '/' as const,
  matches: () => '/matches' as const,
  match: (id: number) => `/football/match/${id}` as const,
  competitions: () => '/competitions' as const,
  competition: (id: number) => `/football/competition/${id}` as const,
  leaders: (id: number, kind: 'scorers' | 'assists', season?: number) =>
    `/football/leaders/${id}?kind=${kind}${season ? `&season=${season}` : ''}` as const,
  team: (id: number) => `/football/team/${id}` as const,
  player: (id: number) => `/football/player/${id}` as const,
  transfers: () => '/football/transfers' as const,
  news: () => '/news' as const,
  article: (id: number) => `/news/${id}` as const,
  search: () => '/search' as const,
  games: () => '/games' as const,
  game: (id: number) => `/games/${id}` as const,
  settings: () => '/settings' as const,
};
