import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LANG, type Lang } from '@sports247/i18n';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePref = 'dark' | 'light' | 'system';

interface Prefs {
  theme: ThemePref;
  lang: Lang;
  hydrated: boolean;
  setTheme: (t: ThemePref) => void;
  setLang: (l: Lang) => void;
}

/** Per-device preferences, persisted in AsyncStorage. */
export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      theme: 'dark',
      lang: DEFAULT_LANG,
      hydrated: false,
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'sports247.prefs',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ theme: s.theme, lang: s.lang }),
      onRehydrateStorage: () => () => usePrefs.setState({ hydrated: true }),
    },
  ),
);
