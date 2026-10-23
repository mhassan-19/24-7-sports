import type { SemanticColors } from '@sports247/tokens';
import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { useLang } from '../lib/locale';
import { useTheme } from '../lib/theme';

/** Fonts loaded in app/_layout.tsx (@expo-google-fonts). Custom fonts select weight by family. */
const FAMILY = {
  ar: { 400: 'Cairo_400Regular', 500: 'Cairo_600SemiBold', 600: 'Cairo_600SemiBold', 700: 'Cairo_700Bold', 800: 'Cairo_800ExtraBold' },
  display: { 400: 'BarlowCondensed_600SemiBold', 500: 'BarlowCondensed_600SemiBold', 600: 'BarlowCondensed_600SemiBold', 700: 'BarlowCondensed_700Bold', 800: 'BarlowCondensed_800ExtraBold' },
  text: { 400: 'Barlow_400Regular', 500: 'Barlow_500Medium', 600: 'Barlow_600SemiBold', 700: 'Barlow_600SemiBold', 800: 'Barlow_600SemiBold' },
} as const;

type Weight = 400 | 500 | 600 | 700 | 800;
type Kind = 'display' | 'text' | 'num';

/** Type scale from the design system (app sizes). Arabic gets taller lines and no uppercase. */
const VARIANTS = {
  display: { kind: 'display', size: 40, weight: 800, lh: 0.98, upper: true },
  h1: { kind: 'display', size: 28, weight: 700, lh: 1.08, upper: true },
  h2: { kind: 'display', size: 22, weight: 700, lh: 1.12, upper: true },
  title: { kind: 'text', size: 16, weight: 600, lh: 1.35 },
  body: { kind: 'text', size: 16, weight: 400, lh: 1.5 },
  label: { kind: 'text', size: 14, weight: 600, lh: 1.35 },
  small: { kind: 'text', size: 14, weight: 400, lh: 1.4 },
  caption: { kind: 'text', size: 12, weight: 500, lh: 1.35 },
  eyebrow: { kind: 'text', size: 12, weight: 600, lh: 1.3, upper: true, spacing: 1.8 },
  score: { kind: 'num', size: 22, weight: 800, lh: 1.1 },
  scoreLg: { kind: 'num', size: 56, weight: 800, lh: 1.05 },
  num: { kind: 'num', size: 16, weight: 700, lh: 1.25 },
} as const satisfies Record<string, { kind: Kind; size: number; weight: Weight; lh: number; upper?: boolean; spacing?: number }>;

export type Variant = keyof typeof VARIANTS;

export interface Props extends TextProps {
  variant?: Variant;
  color?: keyof SemanticColors;
  weight?: Weight;
  size?: number;
  align?: TextStyle['textAlign'];
}

export function Text({ variant = 'body', color = 'text', weight, size, align, style, ...rest }: Props) {
  const lang = useLang();
  const { c } = useTheme();
  const v = VARIANTS[variant];
  const w = (weight ?? v.weight) as Weight;
  const s = size ?? v.size;
  const ar = lang === 'ar';
  const fontFamily = ar ? FAMILY.ar[w] : v.kind === 'text' ? FAMILY.text[w] : FAMILY.display[w];
  const base: TextStyle = {
    fontFamily,
    fontSize: s,
    lineHeight: Math.round(s * (ar ? Math.max(v.lh, 1.3) + 0.15 : v.lh)),
    color: c[color],
    textTransform: !ar && 'upper' in v && v.upper ? 'uppercase' : 'none',
    letterSpacing: !ar && 'spacing' in v ? v.spacing : 0,
    fontVariant: v.kind === 'num' ? ['tabular-nums'] : undefined,
    textAlign: align,
  };
  return <RNText {...rest} style={[base, style]} />;
}
