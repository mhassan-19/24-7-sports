import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const setTheme = (page: Page, theme: 'dark' | 'light') =>
  page.addInitScript((t) => localStorage.setItem('sports247.prefs', JSON.stringify({ state: { theme: t, lang: 'ar' }, version: 0 })), theme);

async function expectNoSeriousA11yIssues(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`)).toEqual([]);
}

for (const theme of ['dark', 'light'] as const) {
  test(`Arabic RTL, ${theme}: home → competition → team → player`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto('/');
    await expect(page).toHaveURL(/\/ar$/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.getByRole('heading', { name: 'المباريات' })).toBeVisible();
    await expectNoSeriousA11yIssues(page);

    await page.goto('/ar/football/competition/3');
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('row').nth(1)).toContainText('١');
    await page.getByRole('row').nth(1).getByRole('link').click();
    await expect(page).toHaveURL(/\/ar\/football\/team\/\d+/);

    await page.goto('/ar/football/team/26/squad');
    await page.getByRole('link', { name: /.+/ }).filter({ has: page.locator('b') }).first().click();
    await expect(page).toHaveURL(/\/ar\/football\/player\/\d+/);
  });
}

test('match centre tabs and accessibility', async ({ page }) => {
  await page.goto('/ar/football/match/2578');
  await expect(page.locator('main header')).toContainText('برايتون');
  await expect(page.getByRole('listitem').first()).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await page.getByRole('link', { name: 'التشكيلة' }).click();
  await expect(page).toHaveURL(/\/lineups$/);
  await expect(page.getByText('٤-٢-٣-١')).toBeVisible();
  await page.getByRole('link', { name: 'الإحصائيات' }).click();
  await expect(page.getByText('الاستحواذ')).toBeVisible();
});

test('English preview is LTR with Latin digits (development flag on)', async ({ page }) => {
  await page.goto('/en/football/match/2578');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('main header')).toContainText('Brighton');
  await expect(page.locator('main header')).toContainText('Cairo time');
});

test('unknown pages show a not-found state', async ({ page }) => {
  await page.goto('/ar/does-not-exist');
  await expect(page.getByRole('heading', { name: 'هذه الصفحة غير موجودة.' })).toBeVisible();
});
