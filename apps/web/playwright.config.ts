import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke tests against the dev server and the TEST API (read-only flows). Uses the locally
 * installed Edge on Windows (or Chrome elsewhere) so no browser download is needed; set
 * PW_CHANNEL to override.
 */
const channel = process.env.PW_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : 'chrome');

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  // The shared TEST API slows down under parallel load: keep concurrency low.
  workers: 2,
  expect: { timeout: 30_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel } },
    { name: 'phone', use: { ...devices['Pixel 7'], channel } },
  ],
  webServer: {
    command: 'corepack pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
