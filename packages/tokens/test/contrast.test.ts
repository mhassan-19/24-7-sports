import { describe, expect, it } from 'vitest';
import { palette, themes } from '../src';

// WCAG 2.x relative luminance and contrast ratio.
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x! + 0.05) / (y! + 0.05);
};

describe('theme contrast (WCAG AA, normal text 4.5:1)', () => {
  for (const [name, t] of Object.entries(themes)) {
    it(`${name}: text, text-2 on bg and surface`, () => {
      for (const fg of [t.text, t.text2]) {
        expect(ratio(fg, t.bg)).toBeGreaterThanOrEqual(4.5);
        expect(ratio(fg, t.surface)).toBeGreaterThanOrEqual(4.5);
      }
    });
    it(`${name}: text-3 and accent text on bg`, () => {
      expect(ratio(t.text3, t.bg)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t.accentText, t.bg)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${name}: label on accent fill`, () => {
      expect(ratio(t.onAccent, t.accent)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('light: text-3 also passes on white cards', () => {
    expect(ratio(themes.light.text3, themes.light.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it('never uses Pulse Orange as text on Bone', () => {
    expect(themes.light.accentText).not.toBe(palette.pulseOrange);
  });
});
