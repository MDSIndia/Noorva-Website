const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

  await page.addInitScript(() => {
    window.__wheelLog = [];
    window.addEventListener(
      "wheel",
      (e) => window.__wheelLog.push({ deltaY: e.deltaY, t: performance.now() }),
      { capture: true, passive: true }
    );
  });

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  // Dismiss welcome overlay (two interactions needed)
  await page.mouse.wheel(0, 10);
  await page.waitForTimeout(400);
  await page.mouse.wheel(0, 10);
  await page.waitForTimeout(1200);

  // Scroll to the story gallery and let it "capture" the wheel.
  let captured = false;
  for (let i = 0; i < 60; i++) {
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(200);
    captured = await page.evaluate(() => {
      const el = document.querySelector("#story-gallery");
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return Math.abs(r.top) < 3;
    });
    if (captured) break;
  }
  console.log("GALLERY CAPTURED:", captured);
  await page.waitForTimeout(800);

  const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
  console.log("BODY OVERFLOW (should be 'hidden' once locked):", JSON.stringify(bodyOverflow));

  function getHeadline() {
    return page.evaluate(() => document.querySelector("#story-gallery h2")?.textContent || null);
  }
  function getEyebrow() {
    return page.evaluate(() => document.querySelector("#story-gallery p")?.textContent || null);
  }

  console.log("BEFORE:", await getEyebrow(), "|", await getHeadline());

  await page.mouse.move(800, 450);
  // Send exactly ONE wheel tick (like a single physical mouse-wheel notch).
  await page.mouse.wheel(0, 120);

  // Sample the headline every 150ms for ~3s to see how many distinct
  // headlines we pass through (should be exactly 2: before -> after).
  const seen = [];
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(150);
    const h = await getHeadline();
    if (seen[seen.length - 1] !== h) seen.push(h);
  }
  console.log("HEADLINE SEQUENCE:", JSON.stringify(seen, null, 2));
  console.log("AFTER:", await getEyebrow(), "|", await getHeadline());

  await browser.close();
})();
