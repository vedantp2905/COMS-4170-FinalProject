/**
 * Test Suite 4: Dynamic & SPA behaviour.
 *
 * These tests demonstrate Playwright's auto-waiting / actionability checks on
 * pages where content is loaded asynchronously. Historically these scenarios
 * were the top source of flakiness in Selenium tests because Selenium requires
 * explicit waits.
 */
import { test, expect } from '@playwright/test';

const BASE = 'https://the-internet.herokuapp.com';

test.describe('Dynamic loading', () => {
  test('Example 1: hidden element becomes visible after Start click (auto-wait)', async ({ page }) => {
    await page.goto(`${BASE}/dynamic_loading/1`);
    await page.getByRole('button', { name: 'Start' }).click();
    // Auto-waiting: no explicit wait/sleep. toBeVisible retries until it hits.
    await expect(page.locator('#finish h4')).toHaveText('Hello World!');
  });

  test('Example 2: element added to DOM only after Start click', async ({ page }) => {
    await page.goto(`${BASE}/dynamic_loading/2`);
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.locator('#finish h4')).toHaveText('Hello World!');
  });

  test('Dynamic controls: enable/disable input and remove/add checkbox', async ({ page }) => {
    await page.goto(`${BASE}/dynamic_controls`);
    // Enable the text input
    const input = page.locator('#input-example input[type=text]');
    await expect(input).toBeDisabled();
    await page.getByRole('button', { name: 'Enable' }).click();
    await expect(input).toBeEnabled();
    await input.fill('I can type now');
    await expect(input).toHaveValue('I can type now');

    // Remove the checkbox
    const checkbox = page.locator('#checkbox input');
    await expect(checkbox).toBeVisible();
    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(checkbox).toHaveCount(0);
  });

  test('Infinite scroll: content appends as the viewport scrolls', async ({ page }) => {
    await page.goto(`${BASE}/infinite_scroll`);
    const paragraphs = page.locator('.jscroll-added');
    const initial = await paragraphs.count();
    // Scroll via JS rather than mouse.wheel - the latter is a no-op on
    // touch-emulated mobile profiles.
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
      await page.waitForTimeout(600);
    }
    const after = await paragraphs.count();
    expect(after).toBeGreaterThan(initial);
  });
});

test.describe('Shadow DOM (web components)', () => {
  test('Playwright pierces shadow roots transparently', async ({ page }) => {
    await page.goto(`${BASE}/shadowdom`);
    // The page uses a custom element "my-paragraph" with a <slot>. The slot
    // pulls slotted light-DOM content INTO the shadow root when rendered.
    // Playwright's locators transparently pierce shadow roots, so we can
    // assert on the final rendered text regardless of where it lives.
    const slotted = page.getByText("Let's have some different text!");
    // The demo instantiates the component twice; both must be rendered.
    await expect(slotted).toHaveCount(2);
    await expect(slotted.first()).toBeVisible();
  });
});

test.describe('Network idle / SPA-style', () => {
  test('YouTube front page loads core layout', async ({ page }, testInfo) => {
    await page.goto('https://www.youtube.com/', { waitUntil: 'domcontentloaded' });
    // YouTube is a heavy SPA. On mobile emulation it redirects to
    // m.youtube.com which uses a completely different DOM tree. We accept
    // either layout.
    const desktopMast = page.locator('#masthead, ytd-masthead');
    const mobileRoot = page.locator('#app, ytm-mobile-topbar-renderer, ytm-pivot-bar-renderer');
    const shown = await Promise.race([
      desktopMast.first().waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'desktop'),
      mobileRoot.first().waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'mobile'),
    ]).catch(() => null);
    expect(shown).not.toBeNull();
    testInfo.annotations.push({ type: 'youtube-layout', description: String(shown) });
  });
});
