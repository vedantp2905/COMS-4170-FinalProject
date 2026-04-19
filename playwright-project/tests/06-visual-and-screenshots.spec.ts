/**
 * Test Suite 6: Visual regression and screenshots.
 *
 * Playwright ships a pixel-diffing assertion (toHaveScreenshot) that stores a
 * baseline and compares future runs to it. We also demonstrate full-page
 * screenshots and element screenshots that could be attached to a bug ticket.
 */
import { test, expect } from '@playwright/test';

test.describe('Screenshots and visual regression', () => {
  test('full-page screenshot of example.com', async ({ page }, testInfo) => {
    await page.goto('https://example.com');
    const buf = await page.screenshot({ fullPage: true });
    await testInfo.attach('example-fullpage.png', { body: buf, contentType: 'image/png' });
    expect(buf.length).toBeGreaterThan(1000); // sanity: at least a few KB
  });

  test('element screenshot of Example Domain heading', async ({ page }, testInfo) => {
    await page.goto('https://example.com');
    const el = page.getByRole('heading', { level: 1 });
    const buf = await el.screenshot();
    await testInfo.attach('heading.png', { body: buf, contentType: 'image/png' });
  });

  test('visual regression: Playwright docs home', async ({ page, browserName }, testInfo) => {
    // Baseline screenshots are rendering-engine specific. We only enforce the
    // pixel diff on chromium to keep cross-browser runs deterministic; other
    // engines only do a sanity "nav is visible" check.
    await page.goto('https://playwright.dev/', { waitUntil: 'domcontentloaded' });
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
    if (browserName === 'chromium' && testInfo.project.name === 'chromium') {
      await expect(nav).toHaveScreenshot('pw-nav.png', {
        maxDiffPixelRatio: 0.05,
      });
    }
  });
});
