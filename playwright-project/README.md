# COMS 4170 / SE 4170 — Group Project: Playwright

Hands-on study of **Playwright** (<https://playwright.dev>), Microsoft's
open-source end-to-end browser-testing framework.

**Course PDF (Canvas):** submit `COMS-4170_Playwright_Report.pdf` from the **repository root** (one level up from this folder). Optional sources at the same level: `COMS-4170_Playwright_Report.md`, `COMS-4170_Playwright_Report.tex`.

## What's in here

| Path | Purpose |
|------|---------|
| `playwright.config.ts`      | 5 projects (Chromium / Firefox / WebKit / Pixel 7 / iPhone 14), HTML+JSON+list output, trace/video retention on failure. |
| `tests/01-basic-navigation.spec.ts` | Sanity tests: `example.com`, Wikipedia, MDN, 404 handling via `page.route`. |
| `tests/02-forms-and-inputs.spec.ts` | Forms, dropdowns, file upload, alerts, drag-and-drop; DDG finding. |
| `tests/03-auth-and-state.spec.ts`   | HTTP Basic Auth, form login, `storageState` session reuse, GitHub login evidence. |
| `tests/04-dynamic-spa.spec.ts`      | Auto-waiting on dynamic pages, shadow DOM, YouTube. |
| `tests/05-network-mocking.spec.ts`  | `page.route` blocking & mocking, `APIRequestContext` tests. |
| `tests/06-visual-and-screenshots.spec.ts` | `toHaveScreenshot` visual regression, element screenshots. |
| `tests/07-known-limitations.spec.ts`| reCAPTCHA, Cloudflare, Google MFA, PDF, canvas — documented failures. |
| `tests/08-parallel-and-perf.spec.ts`| Per-engine timing micro-benchmark. |
| `scripts/capture-evidence.ts`       | Optional: screenshots of bot-blocked pages → `evidence/`. |
| `evidence/*.png`                    | Figures used in the course PDF (paths referenced from repo root). |
| `playwright-report/index.html`      | Last run's HTML test output (`npx playwright test` generates this). |

## How to run

```bash
# Prereqs: Node.js 18+ and ~2 GB free disk (Playwright downloads 3 browsers)
npm install
npx playwright install chromium firefox webkit

# Full suite on every project (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari)
npm test

# Or just one project
npx playwright test --project=chromium

# Open the HTML test output from the last run (folder playwright-report/)
npm run view:test-output
```

## Headline results (from the final full run)

| Project          | Tests | Passed | Skipped | Wall time |
| ---------------- | ----: | -----: | ------: | --------: |
| `chromium`       |    44 |     44 |       0 |     45.5 s |
| `firefox`        |    44 |     44 |       0 |     51.9 s |
| `webkit`         |    44 |     43 |       1 |     62.3 s |
| `Mobile Chrome`  |    44 |     43 |       1 |     45.2 s |
| `Mobile Safari`  |    44 |     43 |       1 |     64.7 s |
| **TOTAL**        |   220 |    217 |       3 |   **141 s** |

**0 unexpected failures, 0 flaky tests.** The 3 skips are intentional
(`test.skip()` — HTML5 drag events do not work under WebKit or mobile
touch emulation, so we skip rather than produce noisy false positives).
