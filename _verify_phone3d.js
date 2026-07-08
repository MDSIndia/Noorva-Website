const { chromium } = require('playwright');
const OUT = 'C:\\Users\\MDSIND~1\\AppData\\Local\\Temp\\claude\\c--Users-MDS-India-Desktop-github-repo-Noorva-Website\\6aeaaa42-3914-4d20-a2d3-6cf64f038e23\\scratchpad';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text()); });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);
  await page.mouse.move(195, 400);
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, 10);
    await page.waitForTimeout(400);
    const gone = await page.evaluate(() => !document.body.innerText.includes('Welcome to Noorva'));
    if (gone) break;
  }
  await page.waitForTimeout(500);
  await page.mouse.click(195, 400);
  await page.waitForTimeout(4200);

  const features = await page.$('#features');
  if (!features) {
    console.log('NO #features element found!');
    console.log('ERRORS so far:', JSON.stringify(errors));
    await browser.close();
    return;
  }
  await features.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}\\p3d-1-enter.png` });
  console.log('at enter, hOverflow:', await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));

  // scroll deeper into the pin to advance rotation / feature index
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: `${OUT}\\p3d-2-mid.png` });

  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: `${OUT}\\p3d-3-later.png` });

  for (let i = 0; i < 14; i++) {
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: `${OUT}\\p3d-4-exit.png` });

  console.log('final hOverflow:', await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));
  console.log('ERRORS:', JSON.stringify(errors, null, 2));
  await browser.close();
})();
