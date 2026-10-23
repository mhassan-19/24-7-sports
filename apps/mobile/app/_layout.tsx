import '../src/polyfills';
// Per-weight imports so only these ten font files ship (the package roots bundle every weight).
import { Barlow_400Regular } from '@expo-google-fonts/barlow/400Regular';
import { Barlow_500Medium } from '@expo-google-fonts/barlow/500Medium';
import { Barlow_600SemiBold } from '@expo-google-fonts/barlow/600SemiBold';
import { BarlowCondensed_600SemiBold } from '@expo-google-fonts/barlow-condensed/600SemiBold';
import { BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed/700Bold';
import { BarlowCondensed_800ExtraBold } from '@expo-google-fonts/barlow-condensed/800ExtraBold';
import { Cairo_400Regular } from '@expo-google-fonts/cairo/400Regular';
import { Cairo_600SemiBold } from '@expo-google-fonts/cairo/600SemiBold';
import { Cairo_700Bold } from '@expo-google-fonts/cairo/700Bold';
import { Cairo_800ExtraBold } from '@expo-google-fonts/cairo/800ExtraBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocaleProvider, effectiveLang, syncDirection } from '../src/lib/locale';
import { loadGuestId } from '../src/lib/misc';
import { usePrefs } from '../src/lib/prefs';
import { useTheme } from '../src/lib/theme';
import { AppProviders } from '../src/providers';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
    Cairo_400Regular,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_800ExtraBold,
  });
  const hydrated = usePrefs((s) => s.hydrated);
  const lang = effectiveLang(usePrefs((s) => s.lang));
  const [guestId, setGuestId] = useState<string | null>(null);
  const { c, name } = useTheme();

  useEffect(() => {
    void loadGuestId().then(setGuestId);
  }, []);
  useEffect(() => {
    if (hydrated) syncDirection(lang);
  }, [hydrated, lang]);
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(c.bg);
  }, [c.bg]);

  const ready = fontsLoaded && hydrated && guestId != null;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <AppProviders guestId={guestId}>
        <LocaleProvider lang={lang}>
          <StatusBar style={name === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: 'slide_from_right' }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="search" options={{ presentation: 'fullScreenModal', animation: 'fade_from_bottom' }} />
          </Stack>
        </LocaleProvider>
      </AppProviders>
    </SafeAreaProvider>
  );
}
