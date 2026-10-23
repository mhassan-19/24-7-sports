import { logoAspectRatio, logoMarkSvg, logoPrimarySvg } from '@sports247/tokens';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../lib/theme';

/**
 * The logo from the shared brand SVGs: numerals in the text colour (Midnight on light, Bone on
 * dark) with the Pulse Orange slash, i.e. the approved signature / signature-reversed versions.
 * Phones use the logomark (≥ 48 px wide); the primary logo needs ≥ 120 px.
 */
export function Logo({ layout = 'mark', width }: { layout?: 'primary' | 'mark'; width: number }) {
  const { c } = useTheme();
  return (
    <SvgXml
      xml={layout === 'primary' ? logoPrimarySvg : logoMarkSvg}
      width={width}
      height={width / logoAspectRatio}
      color={c.text}
      accessibilityLabel="24/7 Sports"
    />
  );
}

/** The signature slash: 60°, leaning forward, never mirrored in RTL. */
export function Slash({ height = 18, width = 3, color }: { height?: number; width?: number; color?: string }) {
  const { c } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height, borderRadius: 1, backgroundColor: color ?? c.accent, transform: [{ rotate: '30deg' }] }}
    />
  );
}
