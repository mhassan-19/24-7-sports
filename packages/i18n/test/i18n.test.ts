import { describe, expect, it } from 'vitest';
import ar from '../src/locales/ar.json';
import en from '../src/locales/en.json';
import {
  TIME,
  createI18n,
  dirOf,
  formatEgyptDateTime,
  formatInstantInCairo,
  formatNumber,
  localizeDigits,
} from '../src';

/** Leaf keys with plural suffixes folded, so ar ("views") and en ("views_one/_other") compare. */
const keys = (o: object, p = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k.replace(/_(zero|one|two|few|many|other)$/, '')}`],
  );

describe('resources', () => {
  it('Arabic and English define the same keys', () => {
    expect([...new Set(keys(ar))].sort()).toEqual([...new Set(keys(en))].sort());
  });

  it('translates with interpolation', () => {
    const t = createI18n('en').t;
    expect(t('games.squadPicked', { picked: '3', n: '11' })).toBe('3 of 11 picked');
    // `count` picks the plural form; `n` is the localized number shown to the user.
    expect(t('common.views', { count: 1, n: '1' })).toBe('1 view');
    expect(t('common.views', { count: 5, n: '5' })).toBe('5 views');
    // Arabic plural forms: 2 has its own word, 3–10 take the plural noun, 11+ the singular.
    const ar = createI18n('ar').t;
    expect(ar('player.goalsIn', { count: 2, n: '٢' })).toBe('هدفان');
    expect(ar('player.goalsIn', { count: 7, n: '٧' })).toBe('٧ أهداف');
    expect(ar('player.goalsIn', { count: 21, n: '٢١' })).toBe('٢١ هدف');
  });
});

describe('direction and digits', () => {
  it('Arabic is RTL with Arabic-Indic digits', () => {
    expect(dirOf('ar')).toBe('rtl');
    expect(localizeDigits('4-2-3-1', 'ar')).toBe('٤-٢-٣-١');
    expect(localizeDigits('4-2-3-1', 'en')).toBe('4-2-3-1');
    expect(formatNumber(21, 'ar')).toBe('٢١');
    expect(formatNumber(null, 'ar')).toBe('–');
  });
});

describe('time', () => {
  it('shows Egypt wall-clock time as stored, whatever the viewer timezone', () => {
    expect(formatEgyptDateTime('2026-01-19T23:00', 'en', TIME)).toBe('23:00');
    expect(formatEgyptDateTime('2026-01-19T23:00', 'ar', TIME)).toBe('٢٣:٠٠');
    expect(formatEgyptDateTime('nonsense', 'en', TIME)).toBe('');
  });

  it('converts UTC instants to Cairo time, including summer time', () => {
    // 11 June 2026: Egypt is on summer time (UTC+3).
    expect(formatInstantInCairo('2026-06-11T19:00:00+00:00', 'en', TIME)).toBe('22:00');
    // 15 January 2026: winter time (UTC+2).
    expect(formatInstantInCairo('2026-01-15T19:00:00+00:00', 'en', TIME)).toBe('21:00');
  });
});
