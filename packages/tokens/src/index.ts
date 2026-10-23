// Design tokens for 24/7 Sports, derived only from the 247-sports-design skill.
// See docs/phase-1/04-design-system.md for roles and contrast checks.

export const palette = {
  midnight: '#141416',
  bone: '#F5F3EF',
  pulseOrange: '#FF5A1F',
  electricBlue: '#2B4BFF',
  graphite: '#2A2C31',
  steel: '#8B8F96',
  concrete: '#E4E1DA',
  white: '#FFFFFF',
  // Working colours (text and UI only)
  orangeInk: '#C2410C',
  body: '#4A4C52',
  muted: '#6B6E75',
  mist: '#B9BBC0',
  line: '#CFCBC3',
  lineDark: '#3A3C42',
  blueTint: '#9FB0FF',
  // Match signals, outside the brand palette by product-owner decision (23 Oct 2026): the real
  // colours of yellow and red cards. Used for card icons only.
  cardYellow: '#FFCC00',
  cardRed: '#D7192D',
} as const;

export type ThemeName = 'dark' | 'light';

export interface SemanticColors {
  bg: string;
  surface: string;
  surface2: string;
  surfaceSel: string;
  line: string;
  text: string;
  text2: string;
  text3: string;
  accent: string;
  onAccent: string;
  accentText: string;
  data: string;
  focus: string;
  scrim: string;
  discBg: string;
  discFg: string;
  cardYellow: string;
  cardRed: string;
  /** Thin edge so a yellow card stays visible on white. */
  cardEdge: string;
}

export const themes: Record<ThemeName, SemanticColors> = {
  dark: {
    bg: palette.midnight,
    surface: palette.graphite,
    surface2: palette.graphite,
    surfaceSel: palette.midnight,
    line: palette.lineDark,
    text: palette.bone,
    text2: palette.mist,
    text3: palette.steel,
    accent: palette.pulseOrange,
    onAccent: palette.midnight,
    accentText: palette.pulseOrange,
    data: palette.blueTint,
    focus: palette.pulseOrange,
    scrim: 'rgba(20, 20, 22, 0.6)',
    discBg: palette.bone,
    discFg: palette.midnight,
    cardYellow: palette.cardYellow,
    cardRed: palette.cardRed,
    cardEdge: 'rgba(0, 0, 0, 0.35)',
  },
  light: {
    bg: palette.bone,
    surface: palette.white,
    surface2: palette.concrete,
    surfaceSel: palette.white,
    line: palette.line,
    text: palette.midnight,
    text2: palette.body,
    text3: palette.muted,
    accent: palette.pulseOrange,
    onAccent: palette.midnight,
    accentText: palette.orangeInk,
    data: palette.electricBlue,
    focus: palette.midnight,
    scrim: 'rgba(20, 20, 22, 0.4)',
    discBg: palette.midnight,
    discFg: palette.bone,
    cardYellow: palette.cardYellow,
    cardRed: palette.cardRed,
    cardEdge: 'rgba(20, 20, 22, 0.3)',
  },
};

export const fonts = {
  displayLatin: '"Barlow Condensed", "Arial Narrow", sans-serif',
  textLatin: '"Barlow", Arial, sans-serif',
  arabic: '"Cairo", "Barlow", Arial, sans-serif',
} as const;

/** Type scale in px (app / web ≥ 1024 px where they differ). */
export const typeScale = {
  display: { size: 40, sizeWide: 56, weight: 800, lineHeight: 0.95 },
  headline: { size: 28, sizeWide: 36, weight: 700, lineHeight: 1.05 },
  subhead: { size: 20, weight: 600, lineHeight: 1.2 },
  body: { size: 16, weight: 400, lineHeight: 1.45 },
  label: { size: 14, weight: 600, lineHeight: 1.3 },
  eyebrow: { size: 12, weight: 600, lineHeight: 1.2, letterSpacing: '0.15em' },
  scoreXl: { size: 56, weight: 800 },
  scoreMd: { size: 24, weight: 800 },
  scoreSm: { size: 18, weight: 800 },
} as const;

export const space = [0, 4, 8, 12, 16, 24, 32, 48, 64] as const;
export const radius = { card: 16, small: 12 } as const;
export const motion = { fast: 150, base: 250, easing: 'cubic-bezier(0.2, 0, 0, 1)' } as const;

/** The signature slash: 60° from horizontal, leaning forward. Never mirrored. */
export const slash = { angleDeg: 60, cssRotateDeg: 30 } as const;

/** Stripe band: Pulse Orange on Midnight. */
export const stripes = `repeating-linear-gradient(120deg, ${palette.pulseOrange} 0 10px, ${palette.midnight} 10px 44px)`;

const kebab = (s: string) => s.replace(/[A-Z0-9]/g, (c) => `-${c.toLowerCase()}`);

/** CSS custom properties for one theme, e.g. `--surface-2: #E4E1DA;`. */
export function cssVariables(theme: ThemeName): string {
  return Object.entries(themes[theme])
    .map(([k, v]) => `--${kebab(k)}: ${v};`)
    .join(' ');
}

/**
 * Full stylesheet: dark on :root (brand default), light for an explicit choice or a light OS
 * preference when the user picked "system".
 */
export function themeStylesheet(): string {
  const brand = Object.entries(palette)
    .map(([k, v]) => `--c-${kebab(k)}: ${v};`)
    .join(' ');
  return [
    `:root { ${brand} ${cssVariables('dark')} --stripes: ${stripes}; color-scheme: dark; }`,
    `:root[data-theme="light"] { ${cssVariables('light')} color-scheme: light; }`,
    `@media (prefers-color-scheme: light) { :root[data-theme="system"] { ${cssVariables('light')} color-scheme: light; } }`,
  ].join('\n');
}
export * from './logos';
