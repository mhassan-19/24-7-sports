import i18next, { type i18n } from 'i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';

export type Lang = 'ar' | 'en';
export const LANGS: Lang[] = ['ar', 'en'];
export const DEFAULT_LANG: Lang = 'ar';

export const resources = { ar: { translation: ar }, en: { translation: en } } as const;

export const isLang = (v: unknown): v is Lang => v === 'ar' || v === 'en';
export const dirOf = (lang: Lang): 'rtl' | 'ltr' => (lang === 'ar' ? 'rtl' : 'ltr');

/** Locale tag for Intl. Arabic uses Arabic-Indic digits (product decision Q9). */
export const intlLocale = (lang: Lang) => (lang === 'ar' ? 'ar-EG' : 'en-GB');

export function createI18n(lang: Lang): i18n {
  const instance = i18next.createInstance();
  void instance.init({
    resources,
    lng: lang,
    fallbackLng: 'ar',
    interpolation: { escapeValue: false },
    returnNull: false,
    initAsync: false,
    showSupportNotice: false,
  });
  return instance;
}

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Converts ASCII digits inside API strings ("4-2-3-1", "90+3", "2025/2026") for Arabic. */
export function localizeDigits(value: string | number | null | undefined, lang: Lang): string {
  const s = value == null ? '' : String(value);
  return lang === 'ar' ? s.replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]!) : s;
}

export function formatNumber(value: number | null | undefined, lang: Lang, opts?: Intl.NumberFormatOptions): string {
  if (value == null || Number.isNaN(value)) return '–';
  return new Intl.NumberFormat(intlLocale(lang), opts).format(value);
}

/**
 * Egypt wall-clock time (`YYYY-MM-DDTHH:mm`) formatted without timezone conversion: the value is
 * read and written in UTC so the viewer's own timezone never shifts it.
 */
export function formatEgyptDateTime(wall: string, lang: Lang, opts: Intl.DateTimeFormatOptions): string {
  const m = wall.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return '';
  const date = new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!));
  return new Intl.DateTimeFormat(intlLocale(lang), { ...opts, timeZone: 'UTC' }).format(date);
}

/** An absolute instant (ISO with offset) shown in Egypt time. */
export function formatInstantInCairo(iso: string, lang: Lang, opts: Intl.DateTimeFormatOptions): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(intlLocale(lang), { ...opts, timeZone: 'Africa/Cairo' }).format(d);
}

export const TIME: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
export const DAY: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
export const DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
export const DATE_TIME: Intl.DateTimeFormatOptions = { ...DAY, ...TIME };
