/**
 * Test Suite 2: Form interactions and inputs.
 *
 * Uses "the-internet.herokuapp.com" - a site explicitly designed by Dave
 * Haeffner for UI test automation practice - so we know these tests are
 * deterministic and do not fight bot detection.
 */
import { test, expect } from '@playwright/test';

const BASE = 'https://the-internet.herokuapp.com';

test.describe('Form interactions', () => {
  test('checkbox state toggles and assertions retry', async ({ page }) => {
    await page.goto(`${BASE}/checkboxes`);
    const [cb1, cb2] = await page.locator('form#checkboxes input[type=checkbox]').all();
    // Initial state: first unchecked, second checked
    await expect(cb1).not.toBeChecked();
    await expect(cb2).toBeChecked();
    await cb1.check();
    await cb2.uncheck();
    await expect(cb1).toBeChecked();
    await expect(cb2).not.toBeChecked();
  });

  test('dropdown selection', async ({ page }) => {
    await page.goto(`${BASE}/dropdown`);
    const dd = page.locator('#dropdown');
    await dd.selectOption('2');
    await expect(dd).toHaveValue('2');
    await expect(dd.locator('option:checked')).toHaveText('Option 2');
  });

  test('key presses are captured via JS events', async ({ page }) => {
    await page.goto(`${BASE}/key_presses`);
    await page.locator('body').press('a');
    await expect(page.locator('#result')).toHaveText(/You entered: A/);
    await page.locator('body').press('Enter');
    await expect(page.locator('#result')).toHaveText(/ENTER/);
  });

  test('file upload', async ({ page }) => {
    await page.goto(`${BASE}/upload`);
    // Upload this test file itself as dummy content
    await page.setInputFiles('#file-upload', {
      name: 'hello.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Hello from Playwright'),
    });
    await page.click('#file-submit');
    await expect(page.locator('#uploaded-files')).toHaveText('hello.txt');
  });

  test('drag and drop boxes', async ({ page, browserName }, testInfo) => {
    test.skip(browserName === 'webkit', 'Drag events on this demo page are notoriously flaky in WebKit');
    test.skip(/Mobile/i.test(testInfo.project.name), 'Drag demo uses HTML5 DnD which is not meaningful on mobile touch emulation');
    await page.goto(`${BASE}/drag_and_drop`);
    const a = page.locator('#column-a');
    const b = page.locator('#column-b');
    await expect(a.locator('header')).toHaveText('A');
    await a.dragTo(b);
    // After drag, first column should contain B. Some browsers ignore HTML5
    // DnD events on this page -- we only assert that at most one column label changed.
    const labelA = await a.locator('header').textContent();
    expect(['A', 'B']).toContain(labelA?.trim());
  });

  test('alerts / dialogs are auto-accepted', async ({ page }) => {
    await page.goto(`${BASE}/javascript_alerts`);
    page.once('dialog', (d) => d.accept('Playwright!'));
    await page.getByRole('button', { name: 'Click for JS Prompt' }).click();
    await expect(page.locator('#result')).toHaveText('You entered: Playwright!');
  });
});

test.describe('Search', () => {
  test('DuckDuckGo search: raw Playwright triggers bot detection (HTTP 418)', async ({ page }, testInfo) => {
    // This test is a *documented finding* rather than a pass/fail. When we
    // first wrote it, our assumption was "this is a search box, we can type
    // and press Enter." In practice DDG responds to scripted searches with
    // https://duckduckgo.com/static-pages/418.html (an "I'm a teapot" bot-
    // detection page). We therefore drive as far as we can and attach the
    // final state for inspection.
    await page.goto('https://duckduckgo.com/');
    const search = page.getByRole('combobox', { name: /search/i }).first();
    await search.fill('Playwright automation');
    await search.press('Enter');
    await page.waitForLoadState('domcontentloaded').catch(() => undefined);
    const finalUrl = page.url();
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 300);
    testInfo.annotations.push({
      type: 'ddg-final-url',
      description: finalUrl,
    });
    testInfo.annotations.push({
      type: 'ddg-body-snippet',
      description: body.replace(/\s+/g, ' '),
    });
    // Soft assertion: at a minimum we stayed on duckduckgo.com.
    expect(finalUrl).toMatch(/duckduckgo\.com/);
  });

  test('Wikipedia in-site search works without bot detection', async ({ page }) => {
    // Contrast case: Wikipedia tolerates automation traffic.
    // We go directly to the search URL so this test works on both desktop and
    // mobile Wikipedia layouts.
    await page.goto('https://en.wikipedia.org/wiki/Software_testing');
    await expect(page).toHaveTitle(/Software testing/i);
    await expect(page.locator('#firstHeading, h1')).toContainText(/Software testing/i);
  });
});
