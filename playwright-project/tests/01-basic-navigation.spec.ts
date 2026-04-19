/**
 * Test Suite 1: Basic navigation and assertions.
 *
 * Exercises the most fundamental Playwright features on well-known static sites
 * that do not depend on bot protection. These tests are expected to PASS and
 * serve as a sanity check that the tool is correctly installed and configured.
 */
import { test, expect } from '@playwright/test';

test.describe('Basic navigation', () => {
  test('example.com loads with expected title and heading', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page).toHaveTitle(/Example Domain/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Example Domain');
    // example.com's link text has varied over the years ("More information..."
    // historically, "Learn more" as of 2026). Match either.
    const link = page.getByRole('link', { name: /(more information|learn more)/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /iana\.org/);
  });

  test('wikipedia main page has search box and featured article', async ({ page }, testInfo) => {
    // Mobile Wikipedia (en.m.wikipedia.org) hides the search behind an icon
    // and uses a completely different layout. Use the desktop-style
    // #searchInput which exists on desktop, or the mobile search button.
    await page.goto('https://en.wikipedia.org/wiki/Main_Page');
    await expect(page).toHaveTitle(/Wikipedia/);
    const isMobile = /Mobile/i.test(testInfo.project.name);
    if (isMobile) {
      // Mobile layout: search icon button exposed via role=button, name="Search"
      const searchBtn = page.getByRole('button', { name: /^Search$/i }).first();
      await expect(searchBtn).toBeVisible();
    } else {
      const search = page.locator('#searchInput, input[name="search"]').first();
      await expect(search).toBeVisible();
      await expect(page.locator('#mp-tfa, #mainpage-featured-article')).toBeVisible();
    }
  });

  test('MDN homepage loads primary navigation', async ({ page }) => {
    await page.goto('https://developer.mozilla.org/');
    await expect(page).toHaveTitle(/MDN/);
    await expect(page.getByRole('banner')).toBeVisible();
  });

  test('HTTP status code for a non-existent page is 404', async ({ page }) => {
    // httpbin.org is occasionally flaky or blocked in Firefox networks, so
    // we mock the 404 response locally. This is itself a Playwright feature
    // (route-based request interception) covered later in suite 05.
    await page.route('**/status/404', (route) =>
      route.fulfill({ status: 404, body: 'Not Found' })
    );
    const resp = await page.goto('https://example.invalid/status/404').catch(() => null);
    expect(resp?.status()).toBe(404);
  });
});
