/**
 * One-off helper: run outside the test suite to capture screenshots into evidence/.
 *
 *   npx tsx scripts/capture-evidence.ts
 *   # or
 *   npx ts-node scripts/capture-evidence.ts
 */
import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const OUT = path.join(__dirname, '..', 'evidence');
fs.mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('1. Google "may not be secure" block page...');
  await page.goto('https://accounts.google.com/signin', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type=email]', 'coms4170demo@example.com').catch(() => undefined);
  await page.getByRole('button', { name: /next/i }).click({ timeout: 5_000 }).catch(() => undefined);
  await page.waitForTimeout(3_000);
  await page.screenshot({ path: path.join(OUT, 'google-blocks-automation.png'), fullPage: false });

  console.log('2. DDG teapot page (Chromium fingerprint triggers bot detection)...');
  await page.goto('https://duckduckgo.com/');
  const search = page.getByRole('combobox', { name: /search/i }).first();
  await search.fill('Playwright automation');
  await search.press('Enter');
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  await page.waitForTimeout(1_500);
  await page.screenshot({ path: path.join(OUT, 'ddg-418-teapot.png'), fullPage: false });

  console.log('3. Cloudflare challenge on nowsecure.nl...');
  await page.goto('https://nowsecure.nl/', { waitUntil: 'domcontentloaded', timeout: 20_000 }).catch(() => undefined);
  await page.waitForTimeout(3_000);
  await page.screenshot({ path: path.join(OUT, 'cloudflare-challenge.png'), fullPage: false });

  console.log('4. Playwright.dev homepage (baseline for visual regression)...');
  await page.goto('https://playwright.dev/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1_000);
  await page.screenshot({ path: path.join(OUT, 'playwright-dev-home.png'), fullPage: false });

  console.log('5. the-internet dynamic-loading page in action (auto-wait demo)...');
  await page.goto('https://the-internet.herokuapp.com/dynamic_loading/1');
  await page.screenshot({ path: path.join(OUT, 'herokuapp-dynamic-before.png'), fullPage: false });
  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'herokuapp-dynamic-mid.png'), fullPage: false });
  await page.waitForSelector('#finish h4');
  await page.screenshot({ path: path.join(OUT, 'herokuapp-dynamic-after.png'), fullPage: false });

  console.log('6. Multi-tab demo — original tab and new tab side by side...');
  await page.goto('https://the-internet.herokuapp.com/windows');
  await page.screenshot({ path: path.join(OUT, 'multitab-original.png'), fullPage: false });
  const [newTab] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('link', { name: 'Click Here' }).click(),
  ]);
  await newTab.waitForLoadState();
  await newTab.screenshot({ path: path.join(OUT, 'multitab-new-window.png'), fullPage: false });
  await newTab.close();

  await browser.close();
  console.log('Done -> ' + OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
