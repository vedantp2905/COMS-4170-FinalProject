/**
 * Test Suite 8: Parallelism, performance and cross-browser behaviour.
 *
 * These tests are small on purpose - their role is to show that Playwright
 * runs many independent browser contexts in parallel, and to capture a crude
 * timing number for the "Evaluation" section of the write-up.
 */
import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

for (let i = 0; i < 6; i++) {
  test(`parallel navigation #${i + 1}`, async ({ page }) => {
    const start = Date.now();
    await page.goto('https://example.com');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Example Domain');
    const elapsed = Date.now() - start;
    test.info().annotations.push({ type: 'timing', description: `navigation took ${elapsed}ms` });
  });
}

test('user-agent string reflects active browser engine', async ({ page, browserName }) => {
  await page.goto('https://httpbin.org/user-agent');
  const txt = await page.locator('pre').textContent();
  expect(txt).toBeTruthy();
  // Just log the UA per engine so the HTML test output shows the difference.
  test.info().annotations.push({
    type: 'ua',
    description: `[${browserName}] ${txt?.trim()}`,
  });
});
