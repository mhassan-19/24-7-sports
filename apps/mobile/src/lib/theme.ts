import { palette, radius, themes, type SemanticColors, type ThemeName } from '@sports247/tokens';
import { useColorScheme } from 'react-native';
import { usePrefs } from './prefs';

export interface Theme {
  name: ThemeName;
  c: SemanticColors & { brand: typeof palette };
  radius: typeof radius;
}

/** Colours from the shared tokens; dark is the brand default, light uses Bone + white cards. */
export function useTheme(): Theme {
  const pref = usePrefs((s) => s.theme);
  const system = useColorScheme();
  const name: ThemeName = pref === 'system' ? (system === 'light' ? 'light' : 'dark') : pref;
  return { name, c: { ...themes[name], brand: palette }, radius };
}
