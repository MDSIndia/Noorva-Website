const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 500, height: 1000 } });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (msg) => { if (msg.type() === "error") errors.push("console: " + msg.text()); });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  for (let i = 0; i < 10; i++) {
    try { await page.mouse.click(250, 500); } catch {}
    await page.waitForTimeout(300);
    if ((await page.locator("text=Click anywhere to begin").count()) === 0) break;
  }
  await page.waitForTimeout(500);
  await page.mouse.click(250, 500);
  await page.waitForTimeout(4500);
  await page.screenshot({ path: "C:/Users/MDS India/Desktop/github-repo/scratch_diag/current-hero.png" });
  // zoom in on just the portal region
  const box = await page.locator("img[alt='Noorva']").boundingBox();
  console.log("logo box:", JSON.stringify(box));
  console.log("ERRORS:", JSON.stringify(errors));
  await browser.close();
})();
