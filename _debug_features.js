const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);
  await page.mouse.move(720, 450);
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, 10);
    await page.waitForTimeout(400);
    const gone = await page.evaluate(() => !document.body.innerText.includes('Welcome to Noorva'));
    if (gone) break;
  }
  await page.waitForTimeout(500);

  const featuresTop = await page.evaluate(() => document.getElementById('features').getBoundingClientRect().top + window.scrollY);
  const scrubRange = await page.evaluate(() => window.innerHeight * 5);
  await page.evaluate((y) => window.scrollTo(0, y), featuresTop + scrubRange * 0.08);
  await page.waitForTimeout(1200);

  const info = await page.evaluate(() => {
    const matches = Array.from(document.querySelectorAll('#features [style*="--phone-frame-bg"]'));
    return matches.map((el) => ({
      tag: el.tagName,
      cls: el.className,
      rect: el.getBoundingClientRect(),
    }));
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
