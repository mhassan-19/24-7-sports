/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

// Static, indexable routes. Entity pages are discovered through links.
const STATIC_ROUTES = ['', 'football/matches', 'football/competitions', 'football/transfers', 'news', 'games'];

/** Emits robots.txt and sitemap.xml at build time when VITE_SITE_URL is set. */
function seoFiles(siteUrl: string, langs: string[]): Plugin {
  return {
    name: 'sports247-seo-files',
    apply: 'build',
    generateBundle() {
      const origin = siteUrl.replace(/\/+$/, '');
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ''}`,
      });
      if (!origin) return;
      const urls = langs.flatMap((lang) => STATIC_ROUTES.map((r) => `${origin}/${lang}${r ? `/${r}` : ''}`));
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source:
          '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n') +
          '\n</urlset>\n',
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const langs = env.VITE_FEATURE_ENGLISH === 'true' ? ['ar', 'en'] : ['ar'];
  return {
    plugins: [react(), seoFiles(env.VITE_SITE_URL ?? '', langs)],
    // A new id per build/dev start: the persisted offline cache is dropped when mapping code changes.
    define: { __BUILD_ID__: JSON.stringify(Date.now().toString(36)) },
    server: { port: 5173 },
    build: {
      target: 'es2022',
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router'],
            data: ['@tanstack/react-query', 'i18next', 'react-i18next', 'zustand'],
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: { modules: { classNameStrategy: 'non-scoped' } },
    },
  };
});
