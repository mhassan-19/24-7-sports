import { I18nManager } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '../lib/theme';

type Shape = { p: string } | { c: [number, number, number] } | { r: [number, number, number, number, number] };

/** Same icon set as the website (24 × 24, 1.8 stroke). */
const ICONS = {
  home: [{ p: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z' }],
  matches: [{ c: [12, 12, 9] }, { p: 'm12 7 4 3-1.5 4.5h-5L8 10z' }],
  trophy: [{ p: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v2a3 3 0 0 0 4 3M16 6h4v2a3 3 0 0 1-4 3M12 13v4M8 20h8M9 17h6' }],
  news: [{ p: 'M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 13h7M7 16h4' }],
  more: [{ c: [5, 12, 1.2] }, { c: [12, 12, 1.2] }, { c: [19, 12, 1.2] }],
  search: [{ c: [11, 11, 6.5] }, { p: 'm16 16 4.5 4.5' }],
  back: [{ p: 'M15 5 8 12l7 7' }],
  chevron: [{ p: 'm9 5 7 7-7 7' }],
  arrow: [{ p: 'M4 12h15M13 6l6 6-6 6' }],
  moon: [{ p: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z' }],
  sun: [{ c: [12, 12, 4] }, { p: 'M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' }],
  ball: [{ c: [12, 12, 8.5] }, { p: 'm12 8 3.3 2.4-1.3 3.8h-4l-1.3-3.8zM12 3.5V8M20.2 9.7l-4.9.7M17 19.5l-3-5.3M7 19.5l3-5.3M3.8 9.7l4.9.7' }],
  sub: [{ p: 'M7 4v12M3.5 12.5 7 16l3.5-3.5M17 20V8M13.5 11.5 17 8l3.5 3.5' }],
  games: [{ c: [12, 12, 8.5] }, { c: [12, 12, 4.5] }, { c: [12, 12, 0.8] }],
  swap: [{ p: 'M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4' }],
  gear: [{ c: [12, 12, 3] }, { p: 'M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1' }],
  image: [{ r: [3, 5, 18, 14, 2] }, { c: [9, 10, 1.6] }, { p: 'm21 16-5-5-8 8' }],
  offline: [{ p: 'M3 3l18 18M8.5 7A5.5 5.5 0 0 1 17 10.5h.5a3.5 3.5 0 0 1 2.3 6.1M15 18H7a4 4 0 0 1-1.5-7.7' }],
  alert: [{ c: [12, 12, 9] }, { p: 'M12 7.5v5.5M12 16.5v.01' }],
  empty: [{ p: 'M4 5h16v15H4zM4 10h16M9 3v4M15 3v4' }],
  close: [{ p: 'M6 6l12 12M18 6 6 18' }],
} satisfies Record<string, Shape[]>;

export type IconName = keyof typeof ICONS;

/** Directional icons mirror in RTL; everything else (ball, logo, clock…) never does. */
const MIRRORED: IconName[] = ['back', 'chevron', 'arrow'];

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const { c } = useTheme();
  const stroke = color ?? c.text;
  const mirror = MIRRORED.includes(name) && I18nManager.isRTL;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={mirror ? { transform: [{ scaleX: -1 }] } : undefined}>
      {(ICONS[name] as Shape[]).map((s, i) =>
        'p' in s ? (
          <Path key={i} d={s.p} fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        ) : 'c' in s ? (
          <Circle key={i} cx={s.c[0]} cy={s.c[1]} r={s.c[2]} fill="none" stroke={stroke} strokeWidth={1.8} />
        ) : (
          <Rect key={i} x={s.r[0]} y={s.r[1]} width={s.r[2]} height={s.r[3]} rx={s.r[4]} fill="none" stroke={stroke} strokeWidth={1.8} />
        ),
      )}
    </Svg>
  );
}
