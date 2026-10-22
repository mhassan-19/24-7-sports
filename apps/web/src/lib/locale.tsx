import type { Id } from '@sports247/domain';
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
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';

const LangContext = createContext<Lang>('ar');
const instances: Partial<Record<Lang, I18n>> = {};
const i18nFor = (lang: Lang) => (instances[lang] ??= createI18n(lang));

/** Provides the route's language: sets <html lang dir> and the i18next instance. */
export function LocaleProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dirOf(lang);
  }, [lang]);
  return (
    <LangContext.Provider value={lang}>
      <I18nextProvider i18n={i18nFor(lang)}>{children}</I18nextProvider>
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);

/** Translation plus formatters bound to the current language. */
export function useFmt() {
  const lang = useLang();
  const { t } = useTranslation();
  return useMemo(
    () => ({
      lang,
      t,
      dir: dirOf(lang),
      n: (v: number | null | undefined, opts?: Intl.NumberFormatOptions) => formatNumber(v, lang, opts),
      /** Plural-aware translation: `count` picks the form, `{{n}}` shows the localized number. */
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

/** Route builders. Every football route sits under /football so other sports can be added. */
export function pathsFor(lang: Lang) {
  const base = `/${lang}`;
  return {
    home: () => base,
    matches: () => `${base}/football/matches`,
    match: (id: Id, tab?: string) => `${base}/football/match/${id}${tab ? `/${tab}` : ''}`,
    competitions: () => `${base}/football/competitions`,
    competition: (id: Id, tab?: string) => `${base}/football/competition/${id}${tab ? `/${tab}` : ''}`,
    leaders: (id: Id, kind: 'scorers' | 'assists') => `${base}/football/competition/${id}/leaders/${kind}`,
    team: (id: Id, tab?: string) => `${base}/football/team/${id}${tab ? `/${tab}` : ''}`,
    player: (id: Id, tab?: string) => `${base}/football/player/${id}${tab ? `/${tab}` : ''}`,
    transfers: () => `${base}/football/transfers`,
    news: () => `${base}/news`,
    article: (id: Id) => `${base}/news/${id}`,
    search: (q?: string) => `${base}/search${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    games: () => `${base}/games`,
    game: (id: Id) => `${base}/games/${id}`,
    settings: () => `${base}/settings`,
    more: () => `${base}/more`,
  };
}

export const usePaths = () => {
  const lang = useLang();
  return useMemo(() => pathsFor(lang), [lang]);
};
