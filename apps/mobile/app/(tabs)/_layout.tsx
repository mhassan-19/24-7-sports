import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFmt } from '../../src/lib/locale';
import { useTheme } from '../../src/lib/theme';
import { Icon, type IconName } from '../../src/ui/Icon';

const TABS: { name: string; key: string; icon: IconName }[] = [
  { name: 'index', key: 'nav.home', icon: 'home' },
  { name: 'matches', key: 'nav.matches', icon: 'matches' },
  { name: 'competitions', key: 'nav.competitions', icon: 'trophy' },
  { name: 'news', key: 'nav.news', icon: 'news' },
  { name: 'more', key: 'nav.more', icon: 'more' },
];

/** Five thumb-reachable tabs; Transfers, Games and Settings live under More (IA plan). */
export default function TabsLayout() {
  const f = useFmt();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accentText,
        tabBarInactiveTintColor: c.text2,
        tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.line, height: 60 + insets.bottom, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: f.lang === 'ar' ? 'Cairo_600SemiBold' : 'Barlow_600SemiBold', fontSize: 11 },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{ title: f.t(t.key), tabBarIcon: ({ color }) => <Icon name={t.icon} color={String(color)} /> }}
        />
      ))}
    </Tabs>
  );
}
