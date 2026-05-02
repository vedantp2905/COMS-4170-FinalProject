/**
 * Test Suite 9: Multi-tab and popup handling.
 *
 * Demonstrates Playwright's ability to capture and control new browser tabs
 * opened by a page. In Selenium this required complex window-handle bookkeeping;
 * Playwright exposes it as a first-class event (page.waitForEvent('popup')).
 *
 * Test site: the-internet.herokuapp.com/windows - a page whose sole purpose
 * is to open a new browser window when a link is clicked.
 */
import { test, expect, type TestInfo } from '@playwright/test';

const BASE = 'https://the-internet.herokuapp.com';

test.describe('Multi-tab / popup handling', () => {
  test('new tab opens and loads the correct page', async ({ page, context }, testInfo) => {
    await page.goto(`${BASE}/windows`);

    // waitForEvent('page') fires when the context spawns a new tab or popup.
    // We set up the listener BEFORE clicking so we never miss the event.
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('link', { name: 'Click Here' }).click(),
    ]);

    await newPage.waitForLoadState();
    await expect(newPage).toHaveURL(/\/windows\/new/);
    await expect(newPage.getByRole('heading', { level: 3 })).toHaveText('New Window');

    const buf = await newPage.screenshot();
    await testInfo.attach('new-tab.png', { body: buf, contentType: 'image/png' });
  });

  test('original tab is unaffected while popup is open', async ({ page, context }, testInfo) => {
    await page.goto(`${BASE}/windows`);
    const originalHeading = page.getByRole('heading', { level: 3 });
    await expect(originalHeading).toHaveText('Opening a new window');

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('link', { name: 'Click Here' }).click(),
    ]);

    await newPage.waitForLoadState();
    // Original page state must be unchanged — the two tabs are independent contexts.
    await expect(originalHeading).toHaveText('Opening a new window');

    const buf = await page.screenshot();
    await testInfo.attach('original-tab-unaffected.png', { body: buf, contentType: 'image/png' });
  });

  test('closing popup leaves original tab fully operational', async ({ page, context }, testInfo) => {
    await page.goto(`${BASE}/windows`);

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('link', { name: 'Click Here' }).click(),
    ]);

    await newPage.waitForLoadState();
    await newPage.close();

    // After closing the popup, the original page should still be interactive.
    await expect(page).toHaveURL(`${BASE}/windows`);
    await expect(page.getByRole('link', { name: 'Click Here' })).toBeVisible();

    const buf = await page.screenshot();
    await testInfo.attach('after-popup-closed.png', { body: buf, contentType: 'image/png' });
  });
});
