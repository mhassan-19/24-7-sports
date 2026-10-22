import { isLang, type Lang } from '@sports247/i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, NavLink, Outlet, ScrollRestoration, useLocation, useMatches, useNavigate, useParams } from 'react-router';
import { env } from '../env';
import { SearchBox, SearchSheet } from '../features/search/SearchBox';
import type { pathsFor} from '../lib/locale';
import { LocaleProvider, useFmt, usePaths } from '../lib/locale';
import { applyTheme, usePrefs } from '../lib/prefs';
import { useOnline } from '../lib/useOnline';
import { Logo } from '../ui/brand';
import { Icon, type IconName } from '../ui/Icon';
import { ui } from '../ui/primitives';
import s from './layout.module.css';

export interface RouteHandle {
  /** Section highlighted in the navigation. */
  section?: 'home' | 'matches' | 'competitions' | 'news' | 'transfers' | 'games' | 'more';
  /** Translation key for the phone header title. */
  titleKey?: string;
  /** Top-level screens show the logo on phones; others show a back button. */
  top?: boolean;
}

function useHandle(): RouteHandle {
  const matches = useMatches();
  return (matches[matches.length - 1]?.handle as RouteHandle | undefined) ?? {};
}

const NAV: { key: NonNullable<RouteHandle['section']>; icon: IconName; to: (p: ReturnType<typeof pathsFor>) => string }[] = [
  { key: 'home', icon: 'home', to: (p) => p.home() },
  { key: 'matches', icon: 'matches', to: (p) => p.matches() },
  { key: 'competitions', icon: 'trophy', to: (p) => p.competitions() },
  { key: 'news', icon: 'news', to: (p) => p.news() },
  { key: 'transfers', icon: 'swap', to: (p) => p.transfers() },
  { key: 'games', icon: 'games', to: (p) => p.games() },
];

const TABBAR = ['home', 'matches', 'competitions', 'news'] as const;

function TopBar() {
  const f = useFmt();
  const paths = usePaths();
  const handle = useHandle();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = usePrefs();
  // Opened directly on a deep link: there is no in-app history to go back to.
  const goBack = () => (location.key === 'default' ? navigate(paths.home()) : navigate(-1));
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBtn = useRef<HTMLButtonElement>(null);
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    searchBtn.current?.focus();
  }, []);
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  return (
    <header className={s.topbar}>
      {!handle.top && (
        <button type="button" className={`${s.iconBtn} ${s.mobileOnly}`} onClick={goBack} aria-label={f.t('nav.back')}>
          <Icon name="back" />
        </button>
      )}
      <NavLink to={paths.home()} className={s.primaryLogo} aria-label={f.t('app.name')}>
        <Logo layout="primary" width={120} />
      </NavLink>
      {handle.top && (
        <NavLink to={paths.home()} className={s.markLogo} aria-label={f.t('app.name')}>
          <Logo layout="mark" width={48} />
        </NavLink>
      )}
      <span className={`${s.title} u`}>{handle.titleKey ? f.t(handle.titleKey) : ''}</span>
      <nav className={s.nav} aria-label={f.t('nav.main')}>
        {NAV.map((n) => (
          <NavLink key={n.key} to={n.to(paths)} aria-current={handle.section === n.key ? 'page' : undefined} end>
            {f.t(`nav.${n.key}`)}
          </NavLink>
        ))}
      </nav>
      {/* Desktop: results drop down under the field. Phones: the icon opens a search sheet. */}
      <div className={s.search}>
        <SearchBox variant="inline" />
      </div>
      <button
        ref={searchBtn}
        type="button"
        className={`${s.iconBtn} ${s.mobileOnly}`}
        aria-label={f.t('nav.search')}
        aria-haspopup="dialog"
        onClick={() => setSearchOpen(true)}
      >
        <Icon name="search" />
      </button>
      {searchOpen && <SearchSheet onClose={closeSearch} />}
      <button
        type="button"
        className={s.iconBtn}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label={f.t('common.theme')}
      >
        <Icon name={isDark ? 'sun' : 'moon'} />
      </button>
    </header>
  );
}

function TabBar() {
  const f = useFmt();
  const paths = usePaths();
  const handle = useHandle();
  const section = handle.section === 'transfers' || handle.section === 'games' ? 'more' : handle.section;
  const items = [...TABBAR.map((k) => NAV.find((n) => n.key === k)!), { key: 'more' as const, icon: 'more' as IconName, to: (p: ReturnType<typeof pathsFor>) => p.more() }];
  return (
    <nav className={s.tabbar} aria-label={f.t('nav.tabs')}>
      {items.map((n) => (
        <NavLink key={n.key} to={n.to(paths)} aria-current={section === n.key ? 'page' : undefined} end>
          <Icon name={n.icon} />
          <span>{f.t(`nav.${n.key}`)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function OfflineBanner() {
  const online = useOnline();
  const { t } = useFmt();
  if (online) return null;
  return (
    <div className={ui.offline} role="status">
      <Icon name="offline" />
      {t('states.offline')}
    </div>
  );
}

function Shell() {
  const f = useFmt();
  return (
    <div className={s.shell}>
      <a href="#main" className={s.skip}>
        {f.t('app.skip')}
      </a>
      <TopBar />
      <OfflineBanner />
      <main id="main" className={s.main} tabIndex={-1}>
        <Outlet />
      </main>
      <footer className={s.footer}>
        <span>24/7 SPORTS</span>
        <span>{f.t('app.tagline')}</span>
      </footer>
      <TabBar />
      <ScrollRestoration />
    </div>
  );
}

/** Validates the :lang segment, applies theme and direction, and renders the shell. */
export function LangLayout() {
  const { lang } = useParams();
  const location = useLocation();
  const { theme, setLang } = usePrefs();
  const valid = isLang(lang) && (lang === 'ar' || env.englishEnabled);

  useEffect(() => applyTheme(theme), [theme]);
  useEffect(() => {
    if (valid) setLang(lang as Lang);
  }, [valid, lang, setLang]);

  if (!valid) {
    // Unknown or disabled language: same page in Arabic.
    const rest = location.pathname.split('/').slice(2).join('/');
    return <Navigate to={`/ar${rest ? `/${rest}` : ''}${location.search}`} replace />;
  }
  return (
    <LocaleProvider lang={lang as Lang}>
      <Shell />
    </LocaleProvider>
  );
}

/** `/` → the saved language (Arabic by default). */
export function RootRedirect() {
  const { lang } = usePrefs();
  return <Navigate to={`/${lang === 'en' && env.englishEnabled ? 'en' : 'ar'}`} replace />;
}
