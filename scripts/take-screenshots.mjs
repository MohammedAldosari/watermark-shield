import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const URL = 'http://127.0.0.1:4200/';
const DOCS_DIR = resolve('docs');
// Capture at roughly the size GitHub renders the README image at, so
// the watermark text doesn't get heavily downscaled when displayed in
// the README column (~960 px wide). deviceScaleFactor 2 keeps it sharp
// on retina displays.
const VIEWPORT = { width: 1280, height: 720 };

await mkdir(DOCS_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });

for (const scheme of ['light', 'dark']) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: scheme,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => !!Array.from(document.querySelectorAll('div')).find(
      (el) => el.style.zIndex === '2147483647' && el.style.position === 'fixed',
    ),
    { timeout: 10000 },
  );
  await page.waitForTimeout(500);
  const out = resolve(DOCS_DIR, `screenshot-v2-${scheme}.png`);
  await page.screenshot({ path: out, fullPage: false });
  console.log(`saved ${scheme} -> ${out}`);
  await context.close();
}

await browser.close();
