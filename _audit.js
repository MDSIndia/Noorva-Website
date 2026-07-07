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
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

async function auditViewport(browser, name, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(name + ' pageerror: ' + e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(name + ' console: ' + msg.text()); });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await dismissOverlay(page, Math.min(720, width - 20), Math.min(450, height - 20));

  // Hero
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}\\audit-${name}-1-hero.png` });

  // check horizontal overflow at hero
  const hOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (hOverflow > 1) errors.push(`${name}: horizontal overflow ${hOverflow}px at hero`);

  // Features
  await page.getByText('Story', { exact: true }).click().catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}\\audit-${name}-2-story.png` });
  const hOverflow2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (hOverflow2 > 1) errors.push(`${name}: horizontal overflow ${hOverflow2}px at story`);

  // Join / closing
  await page.getByText('Join', { exact: true }).click().catch(() => {});
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}\\audit-${name}-3-closing.png` });
  const hOverflow3 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (hOverflow3 > 1) errors.push(`${name}: horizontal overflow ${hOverflow3}px at closing`);

  // Features section directly (scroll from top via Home then down past hero)
  await page.getByText('Home', { exact: true }).click().catch(() => {});
  await page.waitForTimeout(1500);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}\\audit-${name}-4-features.png` });

  console.log(name, 'ERRORS:', JSON.stringify(errors));
  await page.close();
}

(async () => {
  const browser = await chromium.launch();
  await auditViewport(browser, 'mobile', 390, 844);
  await auditViewport(browser, 'tablet', 768, 1024);
  await auditViewport(browser, 'desktop', 1440, 900);
  await auditViewport(browser, 'narrow', 360, 780);
  await browser.close();
})();
