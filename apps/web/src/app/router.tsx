import { createBrowserRouter, type RouteObject } from 'react-router';
import { LangLayout, RootRedirect, type RouteHandle } from './Layout';
import { RouteError } from './RouteError';

/** Lazy page: each screen is its own chunk. */
const page = (
  load: () => Promise<{ default: React.ComponentType }>,
  handle: RouteHandle,
): { lazy: () => Promise<{ Component: React.ComponentType }>; handle: RouteHandle } => ({
  lazy: async () => ({ Component: (await load()).default }),
  handle,
});

export const routes: RouteObject[] = [
  { path: '/', element: <RootRedirect /> },
  {
    path: '/:lang',
    element: <LangLayout />,
    ErrorBoundary: RouteError,
    children: [
      { index: true, ...page(() => import('../pages/HomePage'), { section: 'home', titleKey: 'nav.home', top: true }) },
      {
        path: 'football/matches',
        ...page(() => import('../pages/MatchesPage'), { section: 'matches', titleKey: 'nav.matches', top: true }),
      },
      {
        path: 'football/match/:id/:tab?',
        ...page(() => import('../pages/MatchPage'), { section: 'matches', titleKey: 'nav.matches' }),
      },
      {
        path: 'football/competitions',
        ...page(() => import('../pages/CompetitionsPage'), { section: 'competitions', titleKey: 'nav.competitions', top: true }),
      },
      {
        path: 'football/competition/:id/leaders/:kind',
        ...page(() => import('../pages/LeadersPage'), { section: 'competitions', titleKey: 'nav.competitions' }),
      },
      {
        path: 'football/competition/:id/:tab?',
        ...page(() => import('../pages/CompetitionPage'), { section: 'competitions', titleKey: 'nav.competitions' }),
      },
      {
        path: 'football/team/:id/:tab?',
        ...page(() => import('../pages/TeamPage'), { section: 'competitions', titleKey: 'competition.tabs.teams' }),
      },
      {
        path: 'football/player/:id/:tab?',
        ...page(() => import('../pages/PlayerPage'), { section: 'competitions', titleKey: 'player.tabs.stats' }),
      },
      {
        path: 'football/transfers',
        ...page(() => import('../pages/TransfersPage'), { section: 'transfers', titleKey: 'nav.transfers', top: true }),
      },
      { path: 'news', ...page(() => import('../pages/NewsPage'), { section: 'news', titleKey: 'nav.news', top: true }) },
      { path: 'news/:id', ...page(() => import('../pages/ArticlePage'), { section: 'news', titleKey: 'nav.news' }) },
      { path: 'search', ...page(() => import('../pages/SearchPage'), { titleKey: 'nav.search' }) },
      { path: 'games', ...page(() => import('../pages/GamesPage'), { section: 'games', titleKey: 'nav.games', top: true }) },
      { path: 'games/:id', ...page(() => import('../pages/GamePage'), { section: 'games', titleKey: 'nav.games' }) },
      { path: 'settings', ...page(() => import('../pages/SettingsPage'), { section: 'more', titleKey: 'nav.settings' }) },
      { path: 'more', ...page(() => import('../pages/MorePage'), { section: 'more', titleKey: 'nav.more', top: true }) },
      { path: '*', ...page(() => import('../pages/NotFoundPage'), { titleKey: 'states.notFound' }) },
    ],
  },
];

export const createRouter = () => createBrowserRouter(routes);
