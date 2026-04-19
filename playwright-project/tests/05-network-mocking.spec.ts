/**
 * Test Suite 5: Network interception & API mocking.
 *
 * Demonstrates page.route(), APIRequestContext, and request/response
 * listeners. This is where Playwright shines compared to Selenium - in
 * Selenium you historically needed an external proxy such as BrowserMob.
 */
import { test, expect, request as pwRequest } from '@playwright/test';

test.describe('Network interception', () => {
  test('block images to speed up page loads', async ({ page }) => {
    let blocked = 0;
    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg}', (route) => {
      blocked++;
      return route.abort();
    });
    await page.goto('https://en.wikipedia.org/wiki/Software_testing', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveTitle(/Software testing/);
    expect(blocked).toBeGreaterThan(0);
  });

  test('mock an API response mid-test', async ({ page }) => {
    // We navigate to httpbin.org which echoes JSON; intercept /json and return
    // our own payload. Any JS on the page that reads this endpoint will see
    // the mocked data.
    await page.route('https://httpbin.org/json', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ mocked: true, author: 'COMS4170-team' }),
      });
    });
    await page.goto('https://httpbin.org/json');
    const text = (await page.locator('pre').textContent()) ?? '';
    // Allow whitespace variation between different JSON renderers.
    expect(text.replace(/\s+/g, '')).toContain('"mocked":true');
    expect(text).toContain('COMS4170-team');
  });

  test('capture and assert on outgoing requests', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.url()));
    await page.goto('https://example.com/');
    // At minimum the document itself should have been requested.
    expect(requests.find((u) => u.startsWith('https://example.com/'))).toBeTruthy();
  });
});

test.describe('API-only testing (no browser UI)', () => {
  test('httpbin GET returns caller headers', async () => {
    const ctx = await pwRequest.newContext();
    const resp = await ctx.get('https://httpbin.org/get', {
      headers: { 'x-test-header': 'coms4170' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.headers['X-Test-Header']).toBe('coms4170');
    await ctx.dispose();
  });

  test('httpbin POST echoes JSON body', async () => {
    const ctx = await pwRequest.newContext();
    const resp = await ctx.post('https://httpbin.org/post', {
      data: { project: 'Playwright demo', score: 95 },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.json).toEqual({ project: 'Playwright demo', score: 95 });
    await ctx.dispose();
  });
});
