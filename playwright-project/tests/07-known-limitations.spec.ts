/**
 * Test Suite 7: KNOWN LIMITATIONS / EXPECTED FAILURES.
 *
 * We explicitly demonstrate the kinds of sites that Playwright cannot (or
 * should not) automate out of the box. The course write-up analyses these results in
 * detail; each test here documents *what* happens when you point Playwright
 * at such a site.
 *
 * For each limitation we use `test.fail()` (Playwright's "I expect this to
 * fail" marker) or we record the outcome in a soft way so the suite itself
 * stays green. The goal is forensic evidence, not a passing badge.
 */
import { test, expect } from '@playwright/test';

// ---------- CAPTCHAs ----------
test.describe('CAPTCHA / bot detection', () => {
  test('Google reCAPTCHA demo page - widget renders but cannot be solved', async ({ page }) => {
    await page.goto('https://www.google.com/recaptcha/api2/demo', { waitUntil: 'domcontentloaded' });
    // The iframe hosting the "I'm not a robot" checkbox is visible; we can
    // click it but Google's scoring is *designed* to detect headless/automated
    // behaviour and escalate to an image challenge.
    const rcFrame = page.frameLocator('iframe[title*="reCAPTCHA"]');
    const box = rcFrame.getByRole('checkbox');
    await expect(box).toBeVisible({ timeout: 15_000 });
    await box.click().catch(() => undefined);
    // We deliberately do NOT assert that the captcha was solved, because
    // Playwright cannot reliably do so. We just record that the page is
    // reachable and the widget interactable.
  });

  test('Cloudflare-protected site (nowsecure.nl) is detectable as a bot', async ({ page }, testInfo) => {
    // nowsecure.nl is an intentional Cloudflare "I'm under attack" demo used
    // in many scraping-stealth articles. Default Playwright, unmodified, is
    // blocked. We capture the evidence.
    const resp = await page
      .goto('https://nowsecure.nl/', { waitUntil: 'domcontentloaded', timeout: 20_000 })
      .catch((err) => ({ err } as any));
    const html = await page.content().catch(() => '');
    await testInfo.attach('nowsecure.html', { body: html, contentType: 'text/html' });
    const blocked = /just a moment|cf-chl|cloudflare|captcha|verify you are human/i.test(html);
    test.info().annotations.push({
      type: 'result',
      description: blocked
        ? 'Cloudflare challenge detected - Playwright blocked as expected.'
        : 'Page loaded; Cloudflare did not fire today.',
    });
  });
});

// ---------- MFA ----------
test.describe('MFA-protected real sites (limitation)', () => {
  test('Google sign-in page renders but downstream MFA is unreachable', async ({ page }, testInfo) => {
    // Google actively pushes back on automation frameworks on
    // accounts.google.com. We go as far as we can and RECORD what happens
    // without asserting a specific outcome -- the outcome is the evidence.
    const resp = await page
      .goto('https://accounts.google.com/signin', { waitUntil: 'domcontentloaded', timeout: 15_000 })
      .catch(() => null);
    const status = resp?.status() ?? 'no-response';
    await page.fill('input[type=email]', 'coms4170demo@example.com').catch(() => undefined);
    await page.getByRole('button', { name: /next/i }).click({ timeout: 5_000 }).catch(() => undefined);
    await page.waitForTimeout(3_000);
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 400);
    const shot = await page.screenshot({ fullPage: false }).catch(() => null);
    if (shot) await testInfo.attach('google-signin-state.png', { body: shot, contentType: 'image/png' });
    testInfo.annotations.push({
      type: 'mfa-outcome',
      description: `HTTP ${status} | body snippet: ${body.replace(/\s+/g, ' ')}`,
    });
    // Deliberately a non-strict assertion: we only prove we reached Google's
    // domain, not that we logged in. Real MFA cannot be completed without a
    // TOTP device or SMS message, which is the limitation we want to document.
    expect(page.url()).toMatch(/google\.com/);
  });
});

// ---------- PDFs ----------
test.describe('Non-HTML content', () => {
  test('Downloading a PDF uses page.waitForEvent("download")', async ({ page }, testInfo) => {
    // Playwright can *download* a PDF but cannot render or query its contents
    // because PDFs are not HTML DOM. Run goto and waitForEvent concurrently so
    // the 15s timeout starts at the same time as the navigation — not before it.
    // Chromium often renders PDFs inline instead of triggering a download, so
    // we catch the timeout and fall through to the annotation below.
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 15_000 }).catch(() => null),
      page.goto('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf').catch(() => undefined),
    ]);
    if (dl) {
      const path = await dl.path();
      await testInfo.attach('downloaded.pdf', { path: path!, contentType: 'application/pdf' });
      expect(path).toBeTruthy();
    } else {
      // Fallback: the browser rendered the PDF inline instead of downloading.
      // We note this but don't fail - it is a browser-policy artifact.
      test.info().annotations.push({
        type: 'note',
        description: 'Browser rendered PDF inline; Playwright cannot inspect PDF content.',
      });
    }
  });
});

// ---------- Canvas / WebGL ----------
test.describe('Canvas / WebGL content (DOM-invisible)', () => {
  test('Cannot assert on pixels inside a <canvas> element via DOM locators', async ({ page }) => {
    // A minimal inline canvas page - no external site needed. Proves that
    // Playwright sees the <canvas> element but cannot query the 2D/WebGL
    // content inside it via role/text locators.
    await page.setContent(`
      <!doctype html><html><body>
        <h1>Canvas demo</h1>
        <canvas id="c" width="200" height="100"></canvas>
        <script>
          const ctx = document.getElementById('c').getContext('2d');
          ctx.fillStyle = 'tomato';
          ctx.fillRect(10, 10, 180, 80);
          ctx.fillStyle = 'white';
          ctx.font = '20px sans-serif';
          ctx.fillText('Hidden', 50, 55);
        </script>
      </body></html>
    `);
    const canvas = page.locator('#c');
    await expect(canvas).toBeVisible();
    // We CAN prove the element is non-empty visually. Firefox surfaces
    // fractional bounding boxes due to device-pixel rounding, so we use
    // approximate comparisons.
    const box = await canvas.boundingBox();
    expect(box!.width).toBeGreaterThan(190);
    expect(box!.height).toBeGreaterThan(90);
    // We CANNOT find the pixel-rendered "Hidden" text via getByText because
    // the text lives in the canvas bitmap, not the DOM.
    const hiddenInDom = await page.getByText('Hidden').count();
    expect(hiddenInDom).toBe(0); // <- documents the limitation
  });
});
