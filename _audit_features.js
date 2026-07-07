const { chromium } = require('playwright');

const OUT = 'C:\\Users\\MDSIND~1\\AppData\\Local\\Temp\\claude\\c--Users-MDS-India-Desktop-github-repo-Noorva-Website\\6aeaaa42-3914-4d20-a2d3-6cf64f038e23\\scratchpad';

async function dismissOverlay(page, x, y) {
  await page.waitForTimeout(2600);
  await page.mouse.move(x, y);
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, 10);
    await page.waitForTimeout(400);
    const gone = await page.evaluate(() => !document.body.innerText.includes('Welcome to Noorva'));
    if (gone) break;
  }
  await page.waitForTimeout(500);
}

async function checkFeatures(browser, name, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(name + ': ' + e.message));
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await dismissOverlay(page, Math.min(720, width - 20), Math.min(450, height - 20));

  const featuresTop = await page.evaluate(() => {
    const el = document.getElementById('features');
    return el ? el.getBoundingClientRect().top + window.scrollY : null;
  });
  const scrubRange = await page.evaluate(() => window.innerHeight * 5);

  // Check holds AND transition peaks (worst case for dip)
  const fractions = [0.08, 0.22, 0.36, 0.5, 0.64, 0.78, 0.92];
  let worstOverflow = 0;
  for (const frac of fractions) {
    await page.evaluate((y) => window.scrollTo(0, y), featuresTop + scrubRange * frac);
    await page.waitForTimeout(1200);
    const phoneRect = await page.evaluate(() => {
      const el = document.querySelector('#features [style*="--phone-frame-bg"]') || document.querySelector('#features [class*="will-change-transform"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height };
    });
    if (phoneRect) {
      const overBottom = phoneRect.bottom - height;
      const overTop = -phoneRect.top;
      const worst = Math.max(overBottom, overTop);
      if (worst > worstOverflow) worstOverflow = worst;
      if (worst > 0) {
        await page.screenshot({ path: `${OUT}\\clip-${name}-${frac}.png` });
      }
    }
  }
  console.log(name, width + 'x' + height, 'worst phone overflow (px, negative=fits):', worstOverflow.toFixed(1));
  await page.close();
}

(async () => {
  const browser = await chromium.launch();
  await checkFeatures(browser, 'd1440x900', 1440, 900);
  await checkFeatures(browser, 'd1440x816', 1440, 816);
  await checkFeatures(browser, 'd1280x720', 1280, 720);
  await checkFeatures(browser, 'd1920x1080', 1920, 1080);
  await checkFeatures(browser, 'd1366x768', 1366, 768);
  await browser.close();
})();
