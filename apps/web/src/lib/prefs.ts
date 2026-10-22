import { DEFAULT_LANG, type Lang } from '@sports247/i18n';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePref = 'dark' | 'light' | 'system';

interface Prefs {
  theme: ThemePref;
  lang: Lang;
  setTheme: (t: ThemePref) => void;
  setLang: (l: Lang) => void;
}

/** Per-device preferences. index.html reads the same key to apply the theme before paint. */
export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      theme: 'dark',
      lang: DEFAULT_LANG,
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'sports247.prefs',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ theme: s.theme, lang: s.lang }),
    },
  ),
);

export function applyTheme(theme: ThemePref) {
  document.documentElement.dataset.theme = theme;
}
